import { Room, type Client } from 'colyseus';
import {
  ABILITIES,
  ENEMY_ARCHETYPES,
  ENERGY_CONSTANTS,
  HANGAR_SHIPS,
  NETWORK_MESSAGES,
  PLANETS,
  SIMULATION_CONSTANTS,
  canCastAbility,
  distanceXZ,
  getTerrainHeight,
  regenEnergy,
  resolveDamage,
  resolveRepair,
  resolveShieldRestore,
  stepEnemyAI,
  stepShipMovement,
  type AbilitySlot,
  type CombatEvent,
  type EnemyArchetypeId,
  type MovementInput,
  type PlanetId,
  type ShipModelId
} from '@starcorsair/shared';
import {
  EnemySchema,
  LootDropSchema,
  PlanetRoomState,
  ShipSchema
} from '../schemas/PlanetState.js';

interface QueuedInput {
  input: MovementInput;
}

interface PlayerRuntime {
  cooldownUntil: Partial<Record<AbilitySlot, number>>;
  ownedShips: Set<ShipModelId>;
  respawnAtMs: number;
  lastAfterburnerAtMs: number;
  messageCountWindow: number;
  windowStartMs: number;
}

interface EnemyRuntime {
  homeX: number;
  homeZ: number;
  patrolPhase: number;
  nextAttackAtMs: number;
  respawnAtMs: number;
}

interface DropRuntime {
  expiresAtMs: number;
}

const MAX_PENDING_INPUTS_PER_CLIENT = 16;
const MAX_MESSAGES_PER_SECOND = 60;

const INITIAL_ENEMY_SPAWNS: ReadonlyArray<{
  id: string;
  archetypeId: EnemyArchetypeId;
  x: number;
  z: number;
  phase: number;
}> = [
  { id: 'enemy-scout-1', archetypeId: 'mantis_scout', x: 52, z: -38, phase: 0.2 },
  { id: 'enemy-scout-2', archetypeId: 'mantis_scout', x: -58, z: -32, phase: 1.4 },
  { id: 'enemy-scout-3', archetypeId: 'mantis_scout', x: 46, z: 54, phase: 2.6 },
  { id: 'enemy-scout-4', archetypeId: 'mantis_scout', x: -48, z: 58, phase: 3.9 },
  { id: 'enemy-inter-1', archetypeId: 'mantis_interceptor', x: 96, z: -72, phase: 0.7 },
  { id: 'enemy-inter-2', archetypeId: 'mantis_interceptor', x: -94, z: -68, phase: 2.1 },
  { id: 'enemy-inter-3', archetypeId: 'mantis_interceptor', x: 0, z: -98, phase: 4.4 },
  { id: 'enemy-boss-1', archetypeId: 'mantis_harvester', x: 0, z: -148, phase: 0.0 }
];

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

function isValidAbilitySlot(value: unknown): value is AbilitySlot {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 8
  );
}

function isValidShipModelId(value: unknown): value is ShipModelId {
  return typeof value === 'string' && value in HANGAR_SHIPS;
}

export class PlanetRoom extends Room<PlanetRoomState> {
  private readonly inputQueues = new Map<string, QueuedInput[]>();
  private readonly playerRuntime = new Map<string, PlayerRuntime>();
  private readonly enemyRuntime = new Map<string, EnemyRuntime>();
  private readonly dropRuntime = new Map<string, DropRuntime>();
  private accumulatorSeconds = 0;
  private simTimeMs = 0;
  private dropSeq = 1;

  override onCreate(options: { planetId?: PlanetId }): void {
    const planetId: PlanetId =
      options.planetId && options.planetId in PLANETS
        ? options.planetId
        : 'vega_kalabesh';

    const state = new PlanetRoomState();
    state.planetId = planetId;
    this.setState(state);

    this.spawnInitialEnemies();
    this.registerMessageHandlers();

    // Bucle autoritativo por tick fijo (ARCHITECTURE.md Regla 4 y Regla 9: cero Prisma aquí)
    this.setSimulationInterval((deltaMs) => {
      const clampedMs = Math.min(deltaMs, SIMULATION_CONSTANTS.MAX_DELTA_MS);
      this.accumulatorSeconds += clampedMs / 1000;

      while (this.accumulatorSeconds >= SIMULATION_CONSTANTS.FIXED_DT_SECONDS) {
        this.simTimeMs += SIMULATION_CONSTANTS.FIXED_DT_SECONDS * 1000;
        this.stepSimulation(SIMULATION_CONSTANTS.FIXED_DT_SECONDS);
        this.accumulatorSeconds -= SIMULATION_CONSTANTS.FIXED_DT_SECONDS;
      }
    }, 1000 / SIMULATION_CONSTANTS.TICK_RATE_HZ);
  }

  override onJoin(client: Client, options?: { callsign?: string }): void {
    const planet = PLANETS[this.state.planetId];
    const starterSpec = HANGAR_SHIPS.vega_scout;
    const ship = new ShipSchema();
    ship.id = client.sessionId;
    ship.callsign =
      typeof options?.callsign === 'string' && options.callsign.trim().length > 0
        ? options.callsign.trim().slice(0, 24)
        : `Pilot-${client.sessionId.slice(0, 5)}`;
    ship.shipModelId = starterSpec.id;
    ship.hull = starterSpec.hullMax;
    ship.hullMax = starterSpec.hullMax;
    ship.shield = starterSpec.shieldMax;
    ship.shieldMax = starterSpec.shieldMax;
    ship.energy = ENERGY_CONSTANTS.MAX_ENERGY;
    ship.x = planet.spawnPoint.x;
    ship.z = planet.spawnPoint.z;
    ship.y =
      getTerrainHeight(this.state.planetId, ship.x, ship.z) +
      starterSpec.movement.hoverHeight;
    ship.yaw = 0;
    ship.alive = true;
    ship.inOrbit = false;

    this.state.ships.set(client.sessionId, ship);
    this.inputQueues.set(client.sessionId, []);
    this.playerRuntime.set(client.sessionId, {
      cooldownUntil: {},
      ownedShips: new Set<ShipModelId>(['vega_scout']),
      respawnAtMs: 0,
      lastAfterburnerAtMs: 0,
      messageCountWindow: 0,
      windowStartMs: this.simTimeMs
    });
  }

  override onLeave(client: Client): void {
    this.state.ships.delete(client.sessionId);
    this.inputQueues.delete(client.sessionId);
    this.playerRuntime.delete(client.sessionId);
  }

  private checkRateLimit(sessionId: string): boolean {
    const rt = this.playerRuntime.get(sessionId);
    if (!rt) return false;
    if (this.simTimeMs - rt.windowStartMs >= 1000) {
      rt.windowStartMs = this.simTimeMs;
      rt.messageCountWindow = 0;
    }
    rt.messageCountWindow += 1;
    return rt.messageCountWindow <= MAX_MESSAGES_PER_SECOND;
  }

  private registerMessageHandlers(): void {
    this.onMessage(NETWORK_MESSAGES.PLAYER_INPUT, (client, payload: unknown) => {
      if (!this.checkRateLimit(client.sessionId)) return;
      if (!isValidMovementInput(payload)) return;

      const queue = this.inputQueues.get(client.sessionId);
      if (!queue) return;

      if (queue.length >= MAX_PENDING_INPUTS_PER_CLIENT) {
        queue.shift();
      }
      queue.push({ input: payload });
    });

    this.onMessage(NETWORK_MESSAGES.SELECT_TARGET, (client, payload: unknown) => {
      if (!this.checkRateLimit(client.sessionId)) return;
      const ship = this.state.ships.get(client.sessionId);
      if (!ship) return;

      const targetId =
        typeof payload === 'object' &&
        payload !== null &&
        typeof (payload as Record<string, unknown>).targetId === 'string'
          ? ((payload as Record<string, unknown>).targetId as string)
          : '';

      if (targetId === '') {
        ship.targetId = '';
        return;
      }

      const enemy = this.state.enemies.get(targetId);
      if (enemy && enemy.alive) {
        ship.targetId = enemy.id;
      }
    });

    this.onMessage(NETWORK_MESSAGES.CAST_ABILITY, (client, payload: unknown) => {
      if (!this.checkRateLimit(client.sessionId)) return;
      if (typeof payload !== 'object' || payload === null) return;
      const candidate = payload as Record<string, unknown>;
      if (!isValidAbilitySlot(candidate.slot)) return;

      const explicitTargetId =
        typeof candidate.targetId === 'string' ? candidate.targetId : undefined;
      this.handleCastAbility(client, candidate.slot, explicitTargetId);
    });

    this.onMessage(NETWORK_MESSAGES.BUY_SHIP, (client, payload: unknown) => {
      if (!this.checkRateLimit(client.sessionId)) return;
      if (typeof payload !== 'object' || payload === null) return;
      const candidate = payload as Record<string, unknown>;
      if (!isValidShipModelId(candidate.shipModelId)) return;

      this.handleBuyOrEquipShip(client, candidate.shipModelId);
    });
  }

  private spawnInitialEnemies(): void {
    for (const spawn of INITIAL_ENEMY_SPAWNS) {
      const archetype = ENEMY_ARCHETYPES[spawn.archetypeId];
      const enemy = new EnemySchema();
      enemy.id = spawn.id;
      enemy.archetypeId = archetype.id;
      enemy.name = archetype.name;
      enemy.level = archetype.level;
      enemy.x = spawn.x;
      enemy.z = spawn.z;
      enemy.y =
        getTerrainHeight(this.state.planetId, spawn.x, spawn.z) + archetype.hoverHeight;
      enemy.yaw = 0;
      enemy.hull = archetype.hullMax;
      enemy.hullMax = archetype.hullMax;
      enemy.shield = archetype.shieldMax;
      enemy.shieldMax = archetype.shieldMax;
      enemy.alive = true;
      enemy.aiState = 'patrol';

      this.state.enemies.set(enemy.id, enemy);
      this.enemyRuntime.set(enemy.id, {
        homeX: spawn.x,
        homeZ: spawn.z,
        patrolPhase: spawn.phase,
        nextAttackAtMs: 0,
        respawnAtMs: 0
      });
    }
  }

  private stepSimulation(dtSeconds: number): void {
    // 1. Jugadores: movimiento, energía, cooldowns y respawn
    for (const [sessionId, ship] of this.state.ships.entries()) {
      const rt = this.playerRuntime.get(sessionId);
      if (!rt) continue;

      if (!ship.alive) {
        if (this.simTimeMs >= rt.respawnAtMs) {
          const spec = HANGAR_SHIPS[ship.shipModelId];
          const planet = PLANETS[this.state.planetId];
          ship.x = planet.spawnPoint.x;
          ship.z = planet.spawnPoint.z;
          ship.y =
            getTerrainHeight(this.state.planetId, ship.x, ship.z) +
            spec.movement.hoverHeight;
          ship.hull = ship.hullMax;
          ship.shield = ship.shieldMax;
          ship.energy = ENERGY_CONSTANTS.MAX_ENERGY;
          ship.alive = true;
          ship.targetId = '';
        }
        this.syncCooldowns(ship, rt);
        continue;
      }

      if (ship.inOrbit) {
        ship.afterburner = false;
        ship.hull = ship.hullMax;
        ship.shield = ship.shieldMax;
        ship.energy = ENERGY_CONSTANTS.MAX_ENERGY;
        this.syncCooldowns(ship, rt);
        continue;
      }

      const queue = this.inputQueues.get(sessionId);
      const nextItem = queue?.shift();
      let usingAfterburner = false;

      if (nextItem && nextItem.input.seq > ship.lastProcessedSeq) {
        const spec = HANGAR_SHIPS[ship.shipModelId];
        const canBoost = nextItem.input.afterburner && ship.energy >= 2;
        usingAfterburner = canBoost;

        const nextTransform = stepShipMovement(
          { x: ship.x, y: ship.y, z: ship.z, yaw: ship.yaw },
          { ...nextItem.input, afterburner: canBoost },
          spec.movement,
          this.state.planetId,
          dtSeconds
        );

        ship.x = nextTransform.x;
        ship.y = nextTransform.y;
        ship.z = nextTransform.z;
        ship.yaw = nextTransform.yaw;
        ship.lastProcessedSeq = nextItem.input.seq;
        if (canBoost) {
          rt.lastAfterburnerAtMs = this.simTimeMs;
        }
      } else {
        usingAfterburner = this.simTimeMs - rt.lastAfterburnerAtMs < 110;
      }

      ship.afterburner = usingAfterburner;
      ship.energy = Math.round(
        regenEnergy(ship.energy, dtSeconds, usingAfterburner) * 10
      ) / 10;

      // Limpia targetId si el objetivo murió
      if (ship.targetId) {
        const targetEnemy = this.state.enemies.get(ship.targetId);
        if (!targetEnemy || !targetEnemy.alive) {
          ship.targetId = '';
        }
      }

      this.syncCooldowns(ship, rt);
    }

    // 2. Enemigos IA: patrulla, persecución, ataque autoritativo y respawn
    for (const [enemyId, enemy] of this.state.enemies.entries()) {
      const rt = this.enemyRuntime.get(enemyId);
      if (!rt) continue;
      const archetype = ENEMY_ARCHETYPES[enemy.archetypeId];

      if (!enemy.alive) {
        if (this.simTimeMs >= rt.respawnAtMs) {
          enemy.x = rt.homeX;
          enemy.z = rt.homeZ;
          enemy.y =
            getTerrainHeight(this.state.planetId, enemy.x, enemy.z) +
            archetype.hoverHeight;
          enemy.hull = archetype.hullMax;
          enemy.shield = archetype.shieldMax;
          enemy.alive = true;
          enemy.aiState = 'patrol';
        }
        continue;
      }

      const nearest = this.findNearestTargetablePlayer(enemy.x, enemy.z);
      const aiStep = stepEnemyAI({
        x: enemy.x,
        z: enemy.z,
        yaw: enemy.yaw,
        homeX: rt.homeX,
        homeZ: rt.homeZ,
        patrolPhase: rt.patrolPhase,
        archetype,
        planetId: this.state.planetId,
        dtSeconds,
        targetPlayer: nearest ? { x: nearest.x, z: nearest.z } : null
      });

      enemy.x = aiStep.x;
      enemy.y = aiStep.y;
      enemy.z = aiStep.z;
      enemy.yaw = aiStep.yaw;
      enemy.aiState = aiStep.aiState;
      rt.patrolPhase = aiStep.patrolPhase;

      if (aiStep.inAttackRange && nearest && this.simTimeMs >= rt.nextAttackAtMs) {
        rt.nextAttackAtMs = this.simTimeMs + archetype.attackCooldownMs;
        this.applyEnemyAttack(enemy, nearest, archetype.damage);
      }
    }

    // 3. Expiración de drops antiguos
    for (const [dropId, rt] of this.dropRuntime.entries()) {
      if (this.simTimeMs >= rt.expiresAtMs) {
        this.state.drops.delete(dropId);
        this.dropRuntime.delete(dropId);
      }
    }
  }

  private findNearestTargetablePlayer(ex: number, ez: number): ShipSchema | null {
    let best: ShipSchema | null = null;
    let bestDist = Infinity;

    for (const ship of this.state.ships.values()) {
      if (!ship.alive || ship.inOrbit) continue;
      if (distanceXZ(ship.x, ship.z, 0, 0) <= ENERGY_CONSTANTS.SAFE_ZONE_RADIUS) {
        continue;
      }
      const d = distanceXZ(ex, ez, ship.x, ship.z);
      if (d < bestDist) {
        bestDist = d;
        best = ship;
      }
    }
    return best;
  }

  private applyEnemyAttack(
    enemy: EnemySchema,
    player: ShipSchema,
    rawDamage: number
  ): void {
    const result = resolveDamage({
      rawDamage,
      currentShield: player.shield,
      currentHull: player.hull,
      critChance: 0.08,
      critMultiplier: 1.35,
      rngRoll: Math.random()
    });

    player.shield = result.remainingShield;
    player.hull = result.remainingHull;

    this.emitCombatEvent({
      kind: 'laser_shot',
      sourceId: enemy.id,
      targetId: player.id,
      fromX: enemy.x,
      fromY: enemy.y,
      fromZ: enemy.z,
      toX: player.x,
      toY: player.y,
      toZ: player.z,
      amount: result.finalDamage,
      isCrit: result.isCrit,
      isEnemy: true,
      color: '#ef4444'
    });

    if (result.destroyed) {
      player.alive = false;
      player.targetId = '';
      const rt = this.playerRuntime.get(player.id);
      if (rt) {
        rt.respawnAtMs = this.simTimeMs + ENERGY_CONSTANTS.PLAYER_RESPAWN_MS;
      }
      this.emitCombatEvent({
        kind: 'explosion',
        sourceId: enemy.id,
        targetId: player.id,
        fromX: player.x,
        fromY: player.y,
        fromZ: player.z,
        color: '#f97316',
        message: `${player.callsign} destruido — reapareciendo en zona segura...`
      });
    }
  }

  private handleCastAbility(
    client: Client,
    slot: AbilitySlot,
    explicitTargetId?: string
  ): void {
    const ship = this.state.ships.get(client.sessionId);
    const rt = this.playerRuntime.get(client.sessionId);
    if (!ship || !rt) return;

    const ability = ABILITIES[slot];
    if (ability.id === 'afterburner') return;

    if (explicitTargetId) {
      const candidate = this.state.enemies.get(explicitTargetId);
      if (candidate && candidate.alive) {
        ship.targetId = candidate.id;
      }
    }

    const targetEnemy = ship.targetId ? this.state.enemies.get(ship.targetId) : undefined;
    const hasValidTarget = Boolean(targetEnemy && targetEnemy.alive);
    const dist =
      hasValidTarget && targetEnemy
        ? distanceXZ(ship.x, ship.z, targetEnemy.x, targetEnemy.z)
        : Infinity;

    const check = canCastAbility({
      ability,
      nowMs: this.simTimeMs,
      cooldownUntilMs: rt.cooldownUntil[slot] ?? 0,
      currentEnergy: ship.energy,
      isAlive: ship.alive,
      inOrbit: ship.inOrbit,
      hasValidTarget,
      distanceToTarget: dist
    });

    if (!check.ok) {
      const reasonMessages: Record<string, string> = {
        dead: 'Nave destruida: esperando reconstrucción...',
        in_orbit: 'Desciende a la superficie para usar sistemas de combate.',
        cooldown: `${ability.shortLabel} en enfriamiento.`,
        energy: 'Energía insuficiente. Recoge orbes azules con el Colector [2].',
        no_target: 'Fija un objetivo Mantis (clic o Tab) antes de disparar.',
        out_of_range: `Objetivo fuera de alcance (${Math.round(dist)}m / ${ability.range}m).`
      };
      client.send(NETWORK_MESSAGES.COMBAT_EVENT, {
        kind: 'ability_rejected',
        sourceId: ship.id,
        fromX: ship.x,
        fromY: ship.y,
        fromZ: ship.z,
        message: reasonMessages[check.reason] ?? 'Acción no disponible.'
      } satisfies CombatEvent);
      return;
    }

    ship.energy = Math.max(0, Math.round((ship.energy - ability.energyCost) * 10) / 10);
    rt.cooldownUntil[slot] = this.simTimeMs + ability.cooldownMs;

    const shipSpec = HANGAR_SHIPS[ship.shipModelId];

    switch (ability.id) {
      case 'blaster':
      case 'missile': {
        if (!targetEnemy) return;
        const scaledDamage = ability.baseDamage * shipSpec.damageMultiplier;
        const dmg = resolveDamage({
          rawDamage: scaledDamage,
          currentShield: targetEnemy.shield,
          currentHull: targetEnemy.hull,
          critChance: ability.critChance,
          critMultiplier: ability.critMultiplier,
          rngRoll: Math.random()
        });

        targetEnemy.shield = dmg.remainingShield;
        targetEnemy.hull = dmg.remainingHull;

        this.emitCombatEvent({
          kind: ability.id === 'missile' ? 'missile_hit' : 'laser_shot',
          sourceId: ship.id,
          targetId: targetEnemy.id,
          fromX: ship.x,
          fromY: ship.y,
          fromZ: ship.z,
          toX: targetEnemy.x,
          toY: targetEnemy.y,
          toZ: targetEnemy.z,
          amount: dmg.finalDamage,
          isCrit: dmg.isCrit,
          isEnemy: false,
          color: ability.id === 'missile' ? '#fb923c' : '#22d3ee'
        });

        if (dmg.destroyed) {
          this.handleEnemyDestroyed(targetEnemy, ship);
        }
        break;
      }

      case 'collector': {
        let collectedCount = 0;
        let cryoniteGained = 0;
        let energyGained = 0;
        let blueprintsGained = 0;

        for (const [dropId, drop] of Array.from(this.state.drops.entries())) {
          const d = distanceXZ(ship.x, ship.z, drop.x, drop.z);
          if (d <= ability.range) {
            collectedCount += 1;
            if (drop.kind === 'cryonite') {
              ship.cryonite += drop.amount;
              cryoniteGained += drop.amount;
            } else if (drop.kind === 'energy') {
              const before = ship.energy;
              ship.energy = Math.min(ENERGY_CONSTANTS.MAX_ENERGY, ship.energy + drop.amount);
              energyGained += Math.round(ship.energy - before);
            } else if (drop.kind === 'blueprint') {
              ship.blueprints += drop.amount;
              blueprintsGained += drop.amount;
            }
            this.state.drops.delete(dropId);
            this.dropRuntime.delete(dropId);
          }
        }

        const parts: string[] = [];
        if (cryoniteGained > 0) parts.push(`+${cryoniteGained} Crionita`);
        if (energyGained > 0) parts.push(`+${energyGained} Energía`);
        if (blueprintsGained > 0) parts.push(`+${blueprintsGained} Plano`);

        this.emitCombatEvent({
          kind: 'loot_collected',
          sourceId: ship.id,
          fromX: ship.x,
          fromY: ship.y,
          fromZ: ship.z,
          amount: collectedCount,
          color: '#facc15',
          message:
            collectedCount > 0
              ? `Colector: ${parts.join(' • ')}`
              : 'Colector activado: sin botín dentro de 38m.'
        });
        break;
      }

      case 'repair': {
        const res = resolveRepair(ship.hull, ship.hullMax, ability.repairAmount);
        ship.hull = res.newHull;
        this.emitCombatEvent({
          kind: 'repair_pulse',
          sourceId: ship.id,
          fromX: ship.x,
          fromY: ship.y,
          fromZ: ship.z,
          amount: res.repaired,
          color: '#34d399',
          message: `Droide Reparador: +${res.repaired} Casco`
        });
        break;
      }

      case 'shield': {
        const res = resolveShieldRestore(
          ship.shield,
          ship.shieldMax,
          ability.shieldRestore
        );
        ship.shield = res.newShield;
        this.emitCombatEvent({
          kind: 'shield_pulse',
          sourceId: ship.id,
          fromX: ship.x,
          fromY: ship.y,
          fromZ: ship.z,
          amount: res.restored,
          color: '#38bdf8',
          message: `Escudo Deflector: +${res.restored} Escudo`
        });
        break;
      }

      case 'pulse': {
        let hitCount = 0;
        for (const enemy of this.state.enemies.values()) {
          if (!enemy.alive) continue;
          const d = distanceXZ(ship.x, ship.z, enemy.x, enemy.z);
          if (d > ability.range) continue;

          hitCount += 1;
          const dmg = resolveDamage({
            rawDamage: ability.baseDamage * shipSpec.damageMultiplier,
            currentShield: enemy.shield,
            currentHull: enemy.hull,
            critChance: ability.critChance,
            critMultiplier: ability.critMultiplier,
            rngRoll: Math.random()
          });
          enemy.shield = dmg.remainingShield;
          enemy.hull = dmg.remainingHull;

          if (dmg.destroyed) {
            this.handleEnemyDestroyed(enemy, ship);
          }
        }

        this.emitCombatEvent({
          kind: 'emp_pulse',
          sourceId: ship.id,
          fromX: ship.x,
          fromY: ship.y,
          fromZ: ship.z,
          amount: hitCount,
          color: '#a855f7',
          message: `Pulso EMP impactó ${hitCount} objetivo(s)`
        });
        break;
      }

      case 'orbit': {
        ship.inOrbit = !ship.inOrbit;
        ship.targetId = '';
        if (ship.inOrbit) {
          ship.hull = ship.hullMax;
          ship.shield = ship.shieldMax;
          ship.energy = ENERGY_CONSTANTS.MAX_ENERGY;
        }
        this.emitCombatEvent({
          kind: 'shield_pulse',
          sourceId: ship.id,
          fromX: ship.x,
          fromY: ship.y,
          fromZ: ship.z,
          color: '#38bdf8',
          message: ship.inOrbit
            ? 'En Órbita de Kalabesh — Hangar disponible.'
            : 'Descenso completo sobre la superficie de Kalabesh.'
        });
        break;
      }
    }
  }

  private handleEnemyDestroyed(enemy: EnemySchema, killer: ShipSchema): void {
    enemy.alive = false;
    killer.kills += 1;
    if (killer.targetId === enemy.id) {
      killer.targetId = '';
    }

    const rt = this.enemyRuntime.get(enemy.id);
    if (rt) {
      rt.respawnAtMs = this.simTimeMs + ENERGY_CONSTANTS.ENEMY_RESPAWN_MS;
    }

    const archetype = ENEMY_ARCHETYPES[enemy.archetypeId];
    this.emitCombatEvent({
      kind: 'explosion',
      sourceId: killer.id,
      targetId: enemy.id,
      fromX: enemy.x,
      fromY: enemy.y,
      fromZ: enemy.z,
      color: '#fb923c',
      message: `${enemy.name} destruido — usa Colector [2] para recoger el botín.`
    });

    // Spawn autoritativo de botín (Crionita + Orbe de Energía + Plano opcional)
    this.spawnDrop('cryonite', archetype.cryoniteReward, `${archetype.cryoniteReward} Crionita`, enemy.x + 2.5, enemy.z);
    this.spawnDrop('energy', archetype.energyDropAmount, `+${archetype.energyDropAmount} Energía`, enemy.x - 2.5, enemy.z + 1.5);

    if (Math.random() < archetype.blueprintDropChance) {
      this.spawnDrop('blueprint', 1, 'Plano Tecnológico Vega', enemy.x, enemy.z - 2.8);
    }
  }

  private spawnDrop(
    kind: 'cryonite' | 'energy' | 'blueprint',
    amount: number,
    label: string,
    x: number,
    z: number
  ): void {
    const id = `drop-${this.dropSeq++}`;
    const drop = new LootDropSchema();
    drop.id = id;
    drop.kind = kind;
    drop.amount = amount;
    drop.label = label;
    drop.x = x;
    drop.z = z;
    drop.y = getTerrainHeight(this.state.planetId, x, z) + 2.4;

    this.state.drops.set(id, drop);
    this.dropRuntime.set(id, {
      expiresAtMs: this.simTimeMs + ENERGY_CONSTANTS.LOOT_LIFETIME_MS
    });
  }

  private handleBuyOrEquipShip(client: Client, shipModelId: ShipModelId): void {
    const ship = this.state.ships.get(client.sessionId);
    const rt = this.playerRuntime.get(client.sessionId);
    if (!ship || !rt) return;

    if (!ship.inOrbit) {
      client.send(NETWORK_MESSAGES.COMBAT_EVENT, {
        kind: 'ability_rejected',
        sourceId: ship.id,
        fromX: ship.x,
        fromY: ship.y,
        fromZ: ship.z,
        message: 'Sube a Órbita [8] para cambiar o comprar naves en el Hangar.'
      } satisfies CombatEvent);
      return;
    }

    const spec = HANGAR_SHIPS[shipModelId];
    if (!rt.ownedShips.has(shipModelId)) {
      if (ship.cryonite < spec.costCryonite) {
        client.send(NETWORK_MESSAGES.COMBAT_EVENT, {
          kind: 'ability_rejected',
          sourceId: ship.id,
          fromX: ship.x,
          fromY: ship.y,
          fromZ: ship.z,
          message: `Crionita insuficiente: necesitas ${spec.costCryonite} (tienes ${ship.cryonite}).`
        } satisfies CombatEvent);
        return;
      }
      ship.cryonite -= spec.costCryonite;
      rt.ownedShips.add(shipModelId);
    }

    ship.shipModelId = spec.id;
    ship.hullMax = spec.hullMax;
    ship.hull = spec.hullMax;
    ship.shieldMax = spec.shieldMax;
    ship.shield = spec.shieldMax;

    client.send(NETWORK_MESSAGES.COMBAT_EVENT, {
      kind: 'loot_collected',
      sourceId: ship.id,
      fromX: ship.x,
      fromY: ship.y,
      fromZ: ship.z,
      color: spec.color,
      message: `Hangar: ${spec.name} equipada y lista para descenso.`
    } satisfies CombatEvent);
  }

  private syncCooldowns(ship: ShipSchema, rt: PlayerRuntime): void {
    const rem = (slot: AbilitySlot) =>
      Math.max(0, Math.round((rt.cooldownUntil[slot] ?? 0) - this.simTimeMs));
    ship.cd1 = rem(1);
    ship.cd2 = rem(2);
    ship.cd3 = rem(3);
    ship.cd5 = rem(5);
    ship.cd6 = rem(6);
    ship.cd7 = rem(7);
    ship.cd8 = rem(8);
  }

  private emitCombatEvent(event: CombatEvent): void {
    this.broadcast(NETWORK_MESSAGES.COMBAT_EVENT, event);
  }
}
