import { Client, type Room } from 'colyseus.js';
import {
  NETWORK_MESSAGES,
  SIMULATION_CONSTANTS,
  STARTER_SHIP_MOVEMENT,
  getTerrainHeight,
  stepShipMovement,
  type MovementInput,
  type PlanetId,
  type ShipTransform
} from '@starcorsair/shared';
import { useHudStore } from '../store/useHudStore';

interface ServerShipSnapshot {
  id: string;
  callsign: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hull: number;
  hullMax: number;
  shield: number;
  shieldMax: number;
  energy: number;
  lastProcessedSeq: number;
}

interface ServerPlanetState {
  planetId: PlanetId;
  ships: {
    forEach: (cb: (ship: ServerShipSnapshot, key: string) => void) => void;
    get: (key: string) => ServerShipSnapshot | undefined;
    size: number;
  };
}

export interface MutableTransform {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface RemoteShipBuffer {
  id: string;
  callsign: string;
  target: ShipTransform;
  render: MutableTransform;
}

const WS_URL =
  import.meta.env.VITE_SERVER_WS_URL ??
  `ws://${typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'}:2567`;

/**
 * Gestor de red Colyseus + buffers mutables de alta frecuencia fuera de React
 * (ARCHITECTURE.md Regla 4, Regla 6 y Regla 11).
 */
class PlanetNetworkClient {
  private readonly client = new Client(WS_URL);
  private room: Room<ServerPlanetState> | null = null;
  private connecting = false;
  private planetId: PlanetId = 'vega_kalabesh';

  public localSessionId: string | null = null;
  public localTransform: ShipTransform = {
    x: 0,
    y: getTerrainHeight('vega_kalabesh', 0, 0) + STARTER_SHIP_MOVEMENT.hoverHeight,
    z: 0,
    yaw: 0
  };
  public readonly remoteShips = new Map<string, RemoteShipBuffer>();

  private pendingInputs: MovementInput[] = [];
  private nextSeq = 1;

  public async connect(planetId: PlanetId = 'vega_kalabesh'): Promise<void> {
    if (this.room || this.connecting) return;
    this.connecting = true;
    this.planetId = planetId;
    useHudStore.getState().setConnection('connecting', null, null);

    try {
      const room = await this.client.joinOrCreate<ServerPlanetState>('planet', {
        planetId
      });
      this.room = room;
      this.localSessionId = room.sessionId;
      useHudStore.getState().setConnection('connected', room.sessionId, null);

      room.onStateChange((state) => {
        this.handleStateSnapshot(state);
      });

      room.onLeave(() => {
        this.room = null;
        this.localSessionId = null;
        this.pendingInputs = [];
        this.remoteShips.clear();
        useHudStore.getState().setConnection('offline', null, null);
        useHudStore.getState().setPlayerCount(0);
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo conectar al servidor Colyseus (ws://localhost:2567).';
      useHudStore.getState().setConnection('error', null, message);
    } finally {
      this.connecting = false;
    }
  }

  public disconnect(): void {
    if (this.room) {
      void this.room.leave();
      this.room = null;
    }
    this.localSessionId = null;
    this.pendingInputs = [];
    this.remoteShips.clear();
  }

  /**
   * Envía input throttled (20 Hz) al servidor y aplica predicción inmediata con /shared.
   */
  public sendMovementStep(moveX: number, moveZ: number, afterburner: boolean): void {
    if (!this.room || !this.localSessionId) return;

    const input: MovementInput = {
      seq: this.nextSeq++,
      moveX,
      moveZ,
      afterburner
    };

    // Predicción local usando exactamente la misma función pura del servidor
    this.localTransform = stepShipMovement(
      this.localTransform,
      input,
      STARTER_SHIP_MOVEMENT,
      this.planetId,
      SIMULATION_CONSTANTS.FIXED_DT_SECONDS
    );

    this.pendingInputs.push(input);
    if (this.pendingInputs.length > 32) {
      this.pendingInputs.shift();
    }

    this.room.send(NETWORK_MESSAGES.PLAYER_INPUT, input);
  }

  private handleStateSnapshot(state: ServerPlanetState): void {
    if (!state.ships) return;

    const seenRemoteIds = new Set<string>();
    let count = 0;

    state.ships.forEach((ship, sessionId) => {
      count += 1;

      if (sessionId === this.localSessionId) {
        // Reconciliación autoritativa (ARCHITECTURE.md Regla 4)
        this.pendingInputs = this.pendingInputs.filter(
          (item) => item.seq > ship.lastProcessedSeq
        );

        let reconciled: ShipTransform = {
          x: ship.x,
          y: ship.y,
          z: ship.z,
          yaw: ship.yaw
        };

        for (const pending of this.pendingInputs) {
          reconciled = stepShipMovement(
            reconciled,
            pending,
            STARTER_SHIP_MOVEMENT,
            this.planetId,
            SIMULATION_CONSTANTS.FIXED_DT_SECONDS
          );
        }

        // Corrección suave si la deriva es pequeña, o snap inmediato si es grande
        const drift = Math.hypot(
          reconciled.x - this.localTransform.x,
          reconciled.z - this.localTransform.z
        );
        if (drift > 6) {
          this.localTransform = reconciled;
        } else {
          this.localTransform = {
            x: this.localTransform.x + (reconciled.x - this.localTransform.x) * 0.35,
            y: reconciled.y,
            z: this.localTransform.z + (reconciled.z - this.localTransform.z) * 0.35,
            yaw: reconciled.yaw
          };
        }

        const hud = useHudStore.getState();
        if (
          hud.hull !== ship.hull ||
          hud.shield !== ship.shield ||
          hud.energy !== ship.energy
        ) {
          hud.setVitals({
            hull: ship.hull,
            hullMax: ship.hullMax,
            shield: ship.shield,
            shieldMax: ship.shieldMax,
            energy: ship.energy
          });
        }
        return;
      }

      seenRemoteIds.add(sessionId);
      const existing = this.remoteShips.get(sessionId);
      if (existing) {
        existing.target = { x: ship.x, y: ship.y, z: ship.z, yaw: ship.yaw };
        existing.callsign = ship.callsign;
      } else {
        const initial: ShipTransform = {
          x: ship.x,
          y: ship.y,
          z: ship.z,
          yaw: ship.yaw
        };
        this.remoteShips.set(sessionId, {
          id: sessionId,
          callsign: ship.callsign,
          target: initial,
          render: { ...initial }
        });
      }
    });

    for (const id of this.remoteShips.keys()) {
      if (!seenRemoteIds.has(id)) {
        this.remoteShips.delete(id);
      }
    }

    if (useHudStore.getState().playerCount !== count) {
      useHudStore.getState().setPlayerCount(count);
    }
  }
}

export const planetClient = new PlanetNetworkClient();
