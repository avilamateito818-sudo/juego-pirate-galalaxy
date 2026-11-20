import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  ENEMY_ARCHETYPES,
  ENERGY_CONSTANTS,
  HANGAR_SHIPS,
  PLANETS,
  SIMULATION_CONSTANTS,
  STARTER_SHIP_MOVEMENT,
  canCastAbility,
  distanceXZ,
  getSpatialCellKey,
  getTerrainHeight,
  regenEnergy,
  resolveDamage,
  resolveRepair,
  resolveShieldRestore,
  stepEnemyAI,
  stepShipMovement
} from '../index.js';

describe('@starcorsair/shared — Determinismo, Combate, IA y Terreno', () => {
  it('mantiene zona de aterrizaje plana en el origen de Kalabesh', () => {
    expect(getTerrainHeight('vega_kalabesh', 0, 0)).toBe(0);
    expect(getTerrainHeight('vega_kalabesh', 5, -5)).toBe(0);
  });

  it('produce movimiento idéntico para la misma secuencia de inputs (paridad cliente/servidor)', () => {
    const start = { x: 0, y: STARTER_SHIP_MOVEMENT.hoverHeight, z: 0, yaw: 0 };
    const input = { seq: 1, moveX: 1, moveZ: 1, afterburner: false };

    const clientPrediction = stepShipMovement(
      start,
      input,
      STARTER_SHIP_MOVEMENT,
      'vega_kalabesh',
      SIMULATION_CONSTANTS.FIXED_DT_SECONDS
    );
    const serverAuthority = stepShipMovement(
      start,
      input,
      STARTER_SHIP_MOVEMENT,
      'vega_kalabesh',
      SIMULATION_CONSTANTS.FIXED_DT_SECONDS
    );

    expect(clientPrediction).toEqual(serverAuthority);
    const distMoved = Math.hypot(clientPrediction.x, clientPrediction.z);
    const expectedDist =
      STARTER_SHIP_MOVEMENT.baseSpeed * SIMULATION_CONSTANTS.FIXED_DT_SECONDS;
    expect(distMoved).toBeCloseTo(expectedDist, 6);
  });

  it('limita la posición dentro de las fronteras del planeta', () => {
    const limit = PLANETS.vega_kalabesh.halfSize;
    const result = stepShipMovement(
      { x: limit, y: 5, z: 0, yaw: 0 },
      { seq: 2, moveX: 1, moveZ: 0, afterburner: true },
      STARTER_SHIP_MOVEMENT,
      'vega_kalabesh',
      0.25
    );
    expect(result.x).toBe(limit);
  });

  it('resuelve daño absorbiendo escudo primero y luego casco de forma determinista', () => {
    const nonCrit = resolveDamage({
      rawDamage: 20,
      currentShield: 12,
      currentHull: 50,
      critChance: 0.1,
      critMultiplier: 1.5,
      rngRoll: 0.5
    });

    expect(nonCrit).toEqual({
      finalDamage: 20,
      isCrit: false,
      shieldAbsorbed: 12,
      hullDamage: 8,
      remainingShield: 0,
      remainingHull: 42,
      destroyed: false
    });

    const lethalCrit = resolveDamage({
      rawDamage: 40,
      currentShield: 10,
      currentHull: 50,
      critChance: 0.2,
      critMultiplier: 1.5,
      rngRoll: 0.05
    });

    expect(lethalCrit.isCrit).toBe(true);
    expect(lethalCrit.finalDamage).toBe(60);
    expect(lethalCrit.destroyed).toBe(true);
    expect(lethalCrit.remainingHull).toBe(0);
  });

  it('valida precondiciones de habilidades (cooldown, energía, rango, objetivo, órbita, muerto)', () => {
    const blaster = ABILITIES[1];

    expect(
      canCastAbility({
        ability: blaster,
        nowMs: 1000,
        cooldownUntilMs: 500,
        currentEnergy: 50,
        isAlive: true,
        inOrbit: false,
        hasValidTarget: true,
        distanceToTarget: 30
      })
    ).toEqual({ ok: true });

    expect(
      canCastAbility({
        ability: blaster,
        nowMs: 1000,
        cooldownUntilMs: 1500,
        currentEnergy: 50,
        isAlive: true,
        inOrbit: false,
        hasValidTarget: true,
        distanceToTarget: 30
      })
    ).toEqual({ ok: false, reason: 'cooldown' });

    expect(
      canCastAbility({
        ability: blaster,
        nowMs: 1000,
        cooldownUntilMs: 0,
        currentEnergy: 1,
        isAlive: true,
        inOrbit: false,
        hasValidTarget: true,
        distanceToTarget: 30
      })
    ).toEqual({ ok: false, reason: 'energy' });

    expect(
      canCastAbility({
        ability: blaster,
        nowMs: 1000,
        cooldownUntilMs: 0,
        currentEnergy: 50,
        isAlive: true,
        inOrbit: false,
        hasValidTarget: false,
        distanceToTarget: 0
      })
    ).toEqual({ ok: false, reason: 'no_target' });

    expect(
      canCastAbility({
        ability: blaster,
        nowMs: 1000,
        cooldownUntilMs: 0,
        currentEnergy: 50,
        isAlive: true,
        inOrbit: false,
        hasValidTarget: true,
        distanceToTarget: blaster.range + 10
      })
    ).toEqual({ ok: false, reason: 'out_of_range' });

    expect(
      canCastAbility({
        ability: blaster,
        nowMs: 1000,
        cooldownUntilMs: 0,
        currentEnergy: 50,
        isAlive: true,
        inOrbit: true,
        hasValidTarget: true,
        distanceToTarget: 10
      })
    ).toEqual({ ok: false, reason: 'in_orbit' });
  });

  it('repara casco y recarga escudo sin superar los máximos', () => {
    expect(resolveRepair(80, 110, 40)).toEqual({ newHull: 110, repaired: 30 });
    expect(resolveShieldRestore(25, 60, 40)).toEqual({ newShield: 60, restored: 35 });
  });

  it('regenera energía en pasivo y la drena con postquemador dentro de [0, MAX]', () => {
    const regened = regenEnergy(50, 0.2, false);
    expect(regened).toBeGreaterThan(50);
    expect(regened).toBeLessThanOrEqual(ENERGY_CONSTANTS.MAX_ENERGY);

    const drained = regenEnergy(1, 0.25, true);
    expect(drained).toBe(0);
  });

  it('controla IA enemiga determinista: patrulla, persigue, ataca y respeta zona segura', () => {
    const scout = ENEMY_ARCHETYPES.mantis_scout;

    const patrol = stepEnemyAI({
      x: 70,
      z: 0,
      yaw: 0,
      homeX: 70,
      homeZ: 0,
      patrolPhase: 0,
      archetype: scout,
      planetId: 'vega_kalabesh',
      dtSeconds: 0.05,
      targetPlayer: null
    });
    expect(patrol.aiState).toBe('patrol');
    expect(patrol.inAttackRange).toBe(false);

    const chase = stepEnemyAI({
      x: 70,
      z: 0,
      yaw: 0,
      homeX: 70,
      homeZ: 0,
      patrolPhase: 0,
      archetype: scout,
      planetId: 'vega_kalabesh',
      dtSeconds: 0.05,
      targetPlayer: { x: 108, z: 0 }
    });
    expect(chase.aiState).toBe('chase');
    expect(chase.x).toBeGreaterThan(70);

    const attack = stepEnemyAI({
      x: 70,
      z: 0,
      yaw: 0,
      homeX: 70,
      homeZ: 0,
      patrolPhase: 0,
      archetype: scout,
      planetId: 'vega_kalabesh',
      dtSeconds: 0.05,
      targetPlayer: { x: 85, z: 0 }
    });
    expect(attack.aiState).toBe('attack');
    expect(attack.inAttackRange).toBe(true);

    // Ignora jugadores dentro de la zona segura de aterrizaje
    const ignored = stepEnemyAI({
      x: 35,
      z: 0,
      yaw: 0,
      homeX: 60,
      homeZ: 0,
      patrolPhase: 0,
      archetype: scout,
      planetId: 'vega_kalabesh',
      dtSeconds: 0.05,
      targetPlayer: { x: 5, z: 0 }
    });
    expect(ignored.aiState).toBe('patrol');
  });

  it('expone catálogo de Hangar y utilidades de distancia/AOI consistentes', () => {
    expect(Object.keys(HANGAR_SHIPS)).toEqual(['vega_scout', 'vega_storm', 'vega_tank']);
    expect(distanceXZ(0, 0, 3, 4)).toBe(5);
    expect(getSpatialCellKey(0, 0)).toBe('0:0');
    expect(getSpatialCellKey(65, -1)).toBe('1:-1');
  });
});
