import { Room, type Client } from 'colyseus';
import {
  NETWORK_MESSAGES,
  PLANETS,
  SIMULATION_CONSTANTS,
  STARTER_SHIP_MOVEMENT,
  getTerrainHeight,
  stepShipMovement,
  type MovementInput,
  type PlanetId
} from '@starcorsair/shared';
import { PlanetRoomState, ShipSchema } from '../schemas/PlanetState.js';

interface QueuedInput {
  input: MovementInput;
}

const MAX_PENDING_INPUTS_PER_CLIENT = 16;

function isValidMovementInput(payload: unknown): payload is MovementInput {
  if (typeof payload !== 'object' || payload === null) return false;
  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.seq === 'number' &&
    Number.isInteger(candidate.seq) &&
    candidate.seq >= 0 &&
    typeof candidate.moveX === 'number' &&
    Number.isFinite(candidate.moveX) &&
    typeof candidate.moveZ === 'number' &&
    Number.isFinite(candidate.moveZ) &&
    typeof candidate.afterburner === 'boolean'
  );
}

export class PlanetRoom extends Room<PlanetRoomState> {
  private readonly inputQueues = new Map<string, QueuedInput[]>();
  private accumulatorSeconds = 0;

  override onCreate(options: { planetId?: PlanetId }): void {
    const planetId: PlanetId =
      options.planetId && options.planetId in PLANETS
        ? options.planetId
        : 'vega_kalabesh';

    const state = new PlanetRoomState();
    state.planetId = planetId;
    this.setState(state);

    this.onMessage(NETWORK_MESSAGES.PLAYER_INPUT, (client, payload: unknown) => {
      if (!isValidMovementInput(payload)) {
        return;
      }

      const queue = this.inputQueues.get(client.sessionId);
      if (!queue) return;

      // Hardening anti-flood básico (ARCHITECTURE.md Regla 10)
      if (queue.length >= MAX_PENDING_INPUTS_PER_CLIENT) {
        queue.shift();
      }
      queue.push({ input: payload });
    });

    // Bucle autoritativo por tick fijo (ARCHITECTURE.md Regla 4 y Regla 9: cero Prisma aquí)
    this.setSimulationInterval((deltaMs) => {
      const clampedMs = Math.min(deltaMs, SIMULATION_CONSTANTS.MAX_DELTA_MS);
      this.accumulatorSeconds += clampedMs / 1000;

      while (this.accumulatorSeconds >= SIMULATION_CONSTANTS.FIXED_DT_SECONDS) {
        this.stepSimulation(SIMULATION_CONSTANTS.FIXED_DT_SECONDS);
        this.accumulatorSeconds -= SIMULATION_CONSTANTS.FIXED_DT_SECONDS;
      }
    }, 1000 / SIMULATION_CONSTANTS.TICK_RATE_HZ);
  }

  override onJoin(client: Client, options?: { callsign?: string }): void {
    const planet = PLANETS[this.state.planetId];
    const ship = new ShipSchema();
    ship.id = client.sessionId;
    ship.callsign =
      typeof options?.callsign === 'string' && options.callsign.trim().length > 0
        ? options.callsign.trim().slice(0, 24)
        : `Pilot-${client.sessionId.slice(0, 5)}`;
    ship.x = planet.spawnPoint.x;
    ship.z = planet.spawnPoint.z;
    ship.y =
      getTerrainHeight(this.state.planetId, ship.x, ship.z) +
      STARTER_SHIP_MOVEMENT.hoverHeight;
    ship.yaw = 0;

    this.state.ships.set(client.sessionId, ship);
    this.inputQueues.set(client.sessionId, []);
  }

  override onLeave(client: Client): void {
    this.state.ships.delete(client.sessionId);
    this.inputQueues.delete(client.sessionId);
  }

  private stepSimulation(dtSeconds: number): void {
    for (const [sessionId, ship] of this.state.ships.entries()) {
      const queue = this.inputQueues.get(sessionId);
      const nextItem = queue?.shift();
      if (!nextItem) continue;

      if (nextItem.input.seq <= ship.lastProcessedSeq) {
        continue;
      }

      const nextTransform = stepShipMovement(
        { x: ship.x, y: ship.y, z: ship.z, yaw: ship.yaw },
        nextItem.input,
        STARTER_SHIP_MOVEMENT,
        this.state.planetId,
        dtSeconds
      );

      ship.x = nextTransform.x;
      ship.y = nextTransform.y;
      ship.z = nextTransform.z;
      ship.yaw = nextTransform.yaw;
      ship.lastProcessedSeq = nextItem.input.seq;
    }
  }
}
