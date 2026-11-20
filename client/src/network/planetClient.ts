import { Client, type Room } from 'colyseus.js';
import {
  HANGAR_SHIPS,
  NETWORK_MESSAGES,
  SIMULATION_CONSTANTS,
  distanceXZ,
  getTerrainHeight,
  stepShipMovement,
  type AbilitySlot,
  type CombatEvent,
  type EnemyAiState,
  type EnemyArchetypeId,
  type LootKind,
  type MovementInput,
  type PlanetId,
  type ShipModelId,
  type ShipTransform
} from '@starcorsair/shared';
import { soundEngine } from '../audio/soundEngine';
import { useHudStore, type TargetHudSummary } from '../store/useHudStore';

interface ServerShipSnapshot {
  id: string;
  callsign: string;
  shipModelId: ShipModelId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hull: number;
  hullMax: number;
  shield: number;
  shieldMax: number;
  energy: number;
  cryonite: number;
  blueprints: number;
  kills: number;
  targetId: string;
  alive: boolean;
  inOrbit: boolean;
  afterburner: boolean;
  lastProcessedSeq: number;
  cd1: number;
  cd2: number;
  cd3: number;
  cd5: number;
  cd6: number;
  cd7: number;
  cd8: number;
}

interface ServerEnemySnapshot {
  id: string;
  archetypeId: EnemyArchetypeId;
  name: string;
  level: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hull: number;
  hullMax: number;
  shield: number;
  shieldMax: number;
  alive: boolean;
  aiState: EnemyAiState;
}

interface ServerDropSnapshot {
  id: string;
  kind: LootKind;
  amount: number;
  label: string;
  x: number;
  y: number;
  z: number;
}

interface MapLike<T> {
  forEach: (cb: (item: T, key: string) => void) => void;
  get: (key: string) => T | undefined;
  size: number;
}

interface ServerPlanetState {
  planetId: PlanetId;
  ships: MapLike<ServerShipSnapshot>;
  enemies: MapLike<ServerEnemySnapshot>;
  drops: MapLike<ServerDropSnapshot>;
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
  shipModelId: ShipModelId;
  alive: boolean;
  inOrbit: boolean;
  afterburner: boolean;
  target: ShipTransform;
  render: MutableTransform;
}

export interface EnemyBuffer {
  id: string;
  archetypeId: EnemyArchetypeId;
  name: string;
  level: number;
  hull: number;
  hullMax: number;
  shield: number;
  shieldMax: number;
  alive: boolean;
  aiState: EnemyAiState;
  target: ShipTransform;
  render: MutableTransform;
}

export interface LootDropBuffer {
  id: string;
  kind: LootKind;
  amount: number;
  label: string;
  x: number;
  y: number;
  z: number;
}

export interface VisualEffect {
  id: number;
  kind: 'beam' | 'ring' | 'explosion';
  fromX: number;
  fromY: number;
  fromZ: number;
  toX: number;
  toY: number;
  toZ: number;
  color: string;
  age: number;
  duration: number;
  maxRadius: number;
}

const WS_URL =
  import.meta.env.VITE_SERVER_WS_URL ??
  `ws://${typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'}:2567`;

let effectSeq = 1;

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
  public localShipModelId: ShipModelId = 'vega_scout';
  public localTargetId = '';
  public localAlive = true;
  public localInOrbit = false;
  public localTransform: ShipTransform = {
    x: 0,
    y:
      getTerrainHeight('vega_kalabesh', 0, 0) +
      HANGAR_SHIPS.vega_scout.movement.hoverHeight,
    z: 0,
    yaw: 0
  };

  public readonly remoteShips = new Map<string, RemoteShipBuffer>();
  public readonly enemies = new Map<string, EnemyBuffer>();
  public readonly drops = new Map<string, LootDropBuffer>();
  public readonly effects: VisualEffect[] = [];

  private pendingInputs: MovementInput[] = [];
  private nextSeq = 1;
  private lastHudSyncAt = 0;

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

      room.onMessage(NETWORK_MESSAGES.COMBAT_EVENT, (event: CombatEvent) => {
        this.handleCombatEvent(event);
      });

      room.onLeave(() => {
        this.room = null;
        this.localSessionId = null;
        this.pendingInputs = [];
        this.remoteShips.clear();
        this.enemies.clear();
        this.drops.clear();
        useHudStore.getState().setConnection('offline', null, null);
        useHudStore.getState().setPlayerCount(0);
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo conectar al servidor Colyseus (ws://127.0.0.1:2567).';
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
    this.enemies.clear();
    this.drops.clear();
  }

  public sendMovementStep(moveX: number, moveZ: number, afterburner: boolean): void {
    if (!this.room || !this.localSessionId || !this.localAlive || this.localInOrbit) {
      return;
    }

    const input: MovementInput = {
      seq: this.nextSeq++,
      moveX,
      moveZ,
      afterburner
    };

    const spec = HANGAR_SHIPS[this.localShipModelId];
    const hasEnergy = useHudStore.getState().energy >= 2;

    this.localTransform = stepShipMovement(
      this.localTransform,
      { ...input, afterburner: afterburner && hasEnergy },
      spec.movement,
      this.planetId,
      SIMULATION_CONSTANTS.FIXED_DT_SECONDS
    );

    this.pendingInputs.push(input);
    if (this.pendingInputs.length > 32) {
      this.pendingInputs.shift();
    }

    this.room.send(NETWORK_MESSAGES.PLAYER_INPUT, input);
  }

  public selectTarget(targetId: string | null): void {
    if (!this.room) return;
    this.localTargetId = targetId ?? '';
    this.room.send(NETWORK_MESSAGES.SELECT_TARGET, { targetId });
  }

  public cycleNearestTarget(): void {
    const aliveEnemies = Array.from(this.enemies.values())
      .filter((e) => e.alive)
      .sort(
        (a, b) =>
          distanceXZ(this.localTransform.x, this.localTransform.z, a.target.x, a.target.z) -
          distanceXZ(this.localTransform.x, this.localTransform.z, b.target.x, b.target.z)
      );

    if (aliveEnemies.length === 0) {
      this.selectTarget(null);
      return;
    }

    const currentIdx = aliveEnemies.findIndex((e) => e.id === this.localTargetId);
    const nextEnemy = aliveEnemies[(currentIdx + 1) % aliveEnemies.length];
    if (nextEnemy) {
      this.selectTarget(nextEnemy.id);
    }
  }

  public castAbility(slot: AbilitySlot): void {
    if (!this.room) return;
    this.room.send(NETWORK_MESSAGES.CAST_ABILITY, {
      slot,
      targetId: this.localTargetId || undefined
    });
  }

  public buyOrEquipShip(shipModelId: ShipModelId): void {
    if (!this.room) return;
    this.room.send(NETWORK_MESSAGES.BUY_SHIP, { shipModelId });
  }

  private handleCombatEvent(event: CombatEvent): void {
    const hud = useHudStore.getState();

    switch (event.kind) {
      case 'laser_shot':
        this.pushEffect({
          kind: 'beam',
          fromX: event.fromX,
          fromY: event.fromY,
          fromZ: event.fromZ,
          toX: event.toX ?? event.fromX,
          toY: event.toY ?? event.fromY,
          toZ: event.toZ ?? event.fromZ,
          color: event.color ?? '#22d3ee',
          duration: 0.18,
          maxRadius: 1
        });
        soundEngine.playLaser(Boolean(event.isEnemy));
        if (event.sourceId === this.localSessionId && event.amount) {
          hud.pushLog(
            event.isCrit
              ? `¡CRÍTICO! Bláster inflige ${event.amount} de daño`
              : `Bláster inflige ${event.amount} de daño`,
            event.isCrit ? 'crit' : 'info'
          );
        }
        break;

      case 'missile_hit':
        this.pushEffect({
          kind: 'beam',
          fromX: event.fromX,
          fromY: event.fromY,
          fromZ: event.fromZ,
          toX: event.toX ?? event.fromX,
          toY: event.toY ?? event.fromY,
          toZ: event.toZ ?? event.fromZ,
          color: '#fb923c',
          duration: 0.28,
          maxRadius: 1.8
        });
        this.pushEffect({
          kind: 'explosion',
          fromX: event.toX ?? event.fromX,
          fromY: event.toY ?? event.fromY,
          fromZ: event.toZ ?? event.fromZ,
          toX: event.toX ?? event.fromX,
          toY: event.toY ?? event.fromY,
          toZ: event.toZ ?? event.fromZ,
          color: '#f97316',
          duration: 0.35,
          maxRadius: 4.5
        });
        soundEngine.playMissile();
        if (event.sourceId === this.localSessionId && event.amount) {
          hud.pushLog(
            event.isCrit
              ? `¡COHETE CRÍTICO! ${event.amount} de daño`
              : `Cohete de Plasma: ${event.amount} de daño`,
            event.isCrit ? 'crit' : 'info'
          );
        }
        break;

      case 'emp_pulse':
        this.pushEffect({
          kind: 'ring',
          fromX: event.fromX,
          fromY: event.fromY,
          fromZ: event.fromZ,
          toX: event.fromX,
          toY: event.fromY,
          toZ: event.fromZ,
          color: '#a855f7',
          duration: 0.55,
          maxRadius: 40
        });
        soundEngine.playPulse(320, 90);
        if (event.sourceId === this.localSessionId && event.message) {
          hud.pushLog(event.message, 'crit');
        }
        break;

      case 'repair_pulse':
        this.pushEffect({
          kind: 'ring',
          fromX: event.fromX,
          fromY: event.fromY,
          fromZ: event.fromZ,
          toX: event.fromX,
          toY: event.fromY,
          toZ: event.fromZ,
          color: '#34d399',
          duration: 0.45,
          maxRadius: 8
        });
        soundEngine.playPulse(340, 620);
        if (event.sourceId === this.localSessionId && event.message) {
          hud.pushLog(event.message, 'loot');
        }
        break;

      case 'shield_pulse':
        this.pushEffect({
          kind: 'ring',
          fromX: event.fromX,
          fromY: event.fromY,
          fromZ: event.fromZ,
          toX: event.fromX,
          toY: event.fromY,
          toZ: event.fromZ,
          color: '#38bdf8',
          duration: 0.45,
          maxRadius: 9
        });
        soundEngine.playPulse(480, 740);
        if (event.sourceId === this.localSessionId && event.message) {
          hud.pushLog(event.message, 'info');
        }
        break;

      case 'explosion':
        this.pushEffect({
          kind: 'explosion',
          fromX: event.fromX,
          fromY: event.fromY,
          fromZ: event.fromZ,
          toX: event.fromX,
          toY: event.fromY,
          toZ: event.fromZ,
          color: '#fb923c',
          duration: 0.65,
          maxRadius: 9
        });
        soundEngine.playExplosion();
        if (event.message) {
          hud.pushLog(event.message, event.targetId === this.localSessionId ? 'warn' : 'loot');
        }
        break;

      case 'loot_collected':
        this.pushEffect({
          kind: 'ring',
          fromX: event.fromX,
          fromY: event.fromY,
          fromZ: event.fromZ,
          toX: event.fromX,
          toY: event.fromY,
          toZ: event.fromZ,
          color: '#facc15',
          duration: 0.45,
          maxRadius: 22
        });
        soundEngine.playPulse(520, 1040);
        if (event.sourceId === this.localSessionId && event.message) {
          hud.pushLog(event.message, 'loot');
        }
        break;

      case 'ability_rejected':
        if (event.message) {
          hud.pushLog(event.message, 'warn');
        }
        break;
    }
  }

  private pushEffect(effect: Omit<VisualEffect, 'id' | 'age'>): void {
    this.effects.push({
      ...effect,
      id: effectSeq++,
      age: 0
    });
    if (this.effects.length > 48) {
      this.effects.shift();
    }
  }

  private handleStateSnapshot(state: ServerPlanetState): void {
    // 1. Enemigos IA
    let enemiesTopologyChanged = false;
    if (state.enemies) {
      const seenEnemies = new Set<string>();
      state.enemies.forEach((enemy, id) => {
        seenEnemies.add(id);
        const existing = this.enemies.get(id);
        if (existing) {
          existing.target = { x: enemy.x, y: enemy.y, z: enemy.z, yaw: enemy.yaw };
          existing.hull = enemy.hull;
          existing.hullMax = enemy.hullMax;
          existing.shield = enemy.shield;
          existing.shieldMax = enemy.shieldMax;
          existing.alive = enemy.alive;
          existing.aiState = enemy.aiState;
        } else {
          enemiesTopologyChanged = true;
          const initial: ShipTransform = {
            x: enemy.x,
            y: enemy.y,
            z: enemy.z,
            yaw: enemy.yaw
          };
          this.enemies.set(id, {
            id,
            archetypeId: enemy.archetypeId,
            name: enemy.name,
            level: enemy.level,
            hull: enemy.hull,
            hullMax: enemy.hullMax,
            shield: enemy.shield,
            shieldMax: enemy.shieldMax,
            alive: enemy.alive,
            aiState: enemy.aiState,
            target: initial,
            render: { ...initial }
          });
        }
      });

      for (const id of this.enemies.keys()) {
        if (!seenEnemies.has(id)) {
          this.enemies.delete(id);
          enemiesTopologyChanged = true;
        }
      }
    }
    if (enemiesTopologyChanged) {
      useHudStore.getState().bumpEnemyVersion();
    }

    // 2. Drops de botín
    let dropsChanged = false;
    if (state.drops) {
      const seenDrops = new Set<string>();
      state.drops.forEach((drop, id) => {
        seenDrops.add(id);
        if (!this.drops.has(id)) {
          dropsChanged = true;
        }
        this.drops.set(id, {
          id,
          kind: drop.kind,
          amount: drop.amount,
          label: drop.label,
          x: drop.x,
          y: drop.y,
          z: drop.z
        });
      });

      for (const id of this.drops.keys()) {
        if (!seenDrops.has(id)) {
          this.drops.delete(id);
          dropsChanged = true;
        }
      }
    }
    if (dropsChanged) {
      useHudStore.getState().bumpDropVersion();
    }

    // 3. Pilotos (local + remotos)
    if (!state.ships) return;

    const seenRemoteIds = new Set<string>();
    let count = 0;
    let localSnapshot: ServerShipSnapshot | null = null;

    state.ships.forEach((ship, sessionId) => {
      count += 1;

      if (sessionId === this.localSessionId) {
        localSnapshot = ship;
        this.localShipModelId = ship.shipModelId;
        this.localTargetId = ship.targetId;
        this.localAlive = ship.alive;
        this.localInOrbit = ship.inOrbit;

        this.pendingInputs = this.pendingInputs.filter(
          (item) => item.seq > ship.lastProcessedSeq
        );

        const spec = HANGAR_SHIPS[ship.shipModelId];
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
            spec.movement,
            this.planetId,
            SIMULATION_CONSTANTS.FIXED_DT_SECONDS
          );
        }

        const drift = Math.hypot(
          reconciled.x - this.localTransform.x,
          reconciled.z - this.localTransform.z
        );
        if (drift > 6 || !ship.alive || ship.inOrbit) {
          this.localTransform = reconciled;
        } else {
          this.localTransform = {
            x: this.localTransform.x + (reconciled.x - this.localTransform.x) * 0.35,
            y: reconciled.y,
            z: this.localTransform.z + (reconciled.z - this.localTransform.z) * 0.35,
            yaw: reconciled.yaw
          };
        }
        return;
      }

      seenRemoteIds.add(sessionId);
      const existing = this.remoteShips.get(sessionId);
      if (existing) {
        existing.target = { x: ship.x, y: ship.y, z: ship.z, yaw: ship.yaw };
        existing.callsign = ship.callsign;
        existing.shipModelId = ship.shipModelId;
        existing.alive = ship.alive;
        existing.inOrbit = ship.inOrbit;
        existing.afterburner = ship.afterburner;
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
          shipModelId: ship.shipModelId,
          alive: ship.alive,
          inOrbit: ship.inOrbit,
          afterburner: ship.afterburner,
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

    // Sincronización cuantizada del HUD (~10 Hz) para evitar re-renders innecesarios (Regla 6)
    const now = performance.now();
    if (localSnapshot && now - this.lastHudSyncAt >= 90) {
      this.lastHudSyncAt = now;
      const snap: ServerShipSnapshot = localSnapshot;
      const enemy = snap.targetId ? this.enemies.get(snap.targetId) : undefined;
      const targetSummary: TargetHudSummary | null =
        enemy && enemy.alive
          ? {
              id: enemy.id,
              name: enemy.name,
              level: enemy.level,
              hull: Math.round(enemy.hull),
              hullMax: enemy.hullMax,
              shield: Math.round(enemy.shield),
              shieldMax: enemy.shieldMax,
              distance: Math.round(
                distanceXZ(
                  this.localTransform.x,
                  this.localTransform.z,
                  enemy.target.x,
                  enemy.target.z
                )
              )
            }
          : null;

      useHudStore.getState().syncLocalHud({
        shipModelId: snap.shipModelId,
        hull: Math.round(snap.hull),
        hullMax: snap.hullMax,
        shield: Math.round(snap.shield),
        shieldMax: snap.shieldMax,
        energy: Math.round(snap.energy),
        cryonite: snap.cryonite,
        blueprints: snap.blueprints,
        kills: snap.kills,
        alive: snap.alive,
        inOrbit: snap.inOrbit,
        cooldowns: {
          cd1: snap.cd1,
          cd2: snap.cd2,
          cd3: snap.cd3,
          cd5: snap.cd5,
          cd6: snap.cd6,
          cd7: snap.cd7,
          cd8: snap.cd8
        },
        target: targetSummary
      });
    }
  }
}

export const planetClient = new PlanetNetworkClient();
