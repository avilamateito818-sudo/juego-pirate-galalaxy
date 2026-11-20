import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  DEFAULT_LOADOUT,
  ENEMY_ARCHETYPES,
  ENERGY_CONSTANTS,
  HANGAR_SHIPS,
  MISSIONS,
  PLANETS,
  SIMULATION_CONSTANTS,
  STARTER_SHIP_MOVEMENT,
  TECH_MODULES,
  addBlueprintPiece,
  advanceMissions,
  canCastAbility,
  canClaimMission,
  canCraftOrEquipTech,
  createInitialMissions,
  createInitialTechProgress,
  distanceXZ,
  getSpatialCellKey,
  getTerrainHeight,
  pickBlueprintDrop,
  regenEnergy,
  resolveDamage,
  resolveEffectiveAbility,
  resolveRepair,
  resolveShieldRestore,
  stepEnemyAI,
  stepShipMovement
} from '../index.js';

describe('@starcorsair/shared — Determinismo, Combate, IA, Misiones y Terreno', () => {
  it('mantiene zona de aterrizaje plana en el origen de Kalabesh y Aurora', () => {
    expect(getTerrainHeight('vega_kalabesh', 0, 0)).toBe(0);
    expect(getTerrainHeight('vega_kalabesh', 5, -5)).toBe(0);
    expect(getTerrainHeight('vega_aurora', 0, 0)).toBe(0);
    // Fuera de la zona de aterrizaje, Kalabesh y Aurora tienen relieves distintos
    expect(getTerrainHeight('vega_aurora', 80, 60)).not.toBe(
      getTerrainHeight('vega_kalabesh', 80, 60)
    );
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

  it('avanza y valida reclamación de misiones de forma determinista por planeta y arquetipo', () => {
    let missions = createInitialMissions();
    expect(missions).toHaveLength(Object.keys(MISSIONS).length);

    missions = advanceMissions(missions, {
      kind: 'kill',
      planetId: 'vega_kalabesh',
      archetypeId: 'mantis_scout',
      amount: 3
    });
    expect(canClaimMission(missions, 'mission_kalabesh_patrol')).toBe(true);
    expect(canClaimMission(missions, 'mission_aurora_expedition')).toBe(false);

    missions = advanceMissions(missions, {
      kind: 'kill',
      planetId: 'vega_aurora',
      archetypeId: 'mantis_harvester',
      amount: 1
    });
    expect(canClaimMission(missions, 'mission_harvester_hunt')).toBe(true);

    missions = advanceMissions(missions, {
      kind: 'cryonite',
      planetId: 'vega_kalabesh',
      amount: 100
    });
    expect(canClaimMission(missions, 'mission_cryonite_harvest')).toBe(true);
  });

  it('gestiona planos, fabricación y estadísticas efectivas de tecnología por slot (Fase A)', () => {
    let progress = createInitialTechProgress();

    // Bláster Mk-II arranca bloqueado
    expect(canCraftOrEquipTech(progress, 'blaster_mk2', 500)).toEqual({
      ok: false,
      reason: 'locked'
    });

    // Al recoger 1 plano de blaster_mk2 se desbloquea
    const afterPiece = addBlueprintPiece(progress, 'blaster_mk2');
    progress = afterPiece.next;
    expect(afterPiece.unlockedNow).toBe(true);

    // Crionita insuficiente -> rechazado
    expect(canCraftOrEquipTech(progress, 'blaster_mk2', 20)).toEqual({
      ok: false,
      reason: 'cryonite'
    });

    // Crionita suficiente -> permite fabricar y equipar
    expect(canCraftOrEquipTech(progress, 'blaster_mk2', 100)).toEqual({
      ok: true,
      action: 'craft_and_equip',
      cost: TECH_MODULES.blaster_mk2.costCryonite
    });

    // Equipar cambia daño, cooldown y color de láser determinísticamente
    const mk1 = resolveEffectiveAbility(1, DEFAULT_LOADOUT);
    const mk2 = resolveEffectiveAbility(1, { ...DEFAULT_LOADOUT, 1: 'blaster_mk2' });
    expect(mk2.baseDamage).toBeGreaterThan(mk1.baseDamage);
    expect(mk2.cooldownMs).toBeLessThan(mk1.cooldownMs);
    expect(mk2.beamColor).toBe('#10b981');

    // Selección determinista de drop
    const dropped = pickBlueprintDrop(ENEMY_ARCHETYPES.mantis_harvester.dropPool, 0.0);
    expect(dropped).toBe('blaster_mk3');
  });

  it('expone catálogo de Hangar, Planetas y utilidades de distancia/AOI consistentes', () => {
    expect(Object.keys(PLANETS)).toEqual(['vega_kalabesh', 'vega_aurora']);
    expect(Object.keys(HANGAR_SHIPS)).toEqual(['vega_scout', 'vega_storm', 'vega_tank']);
    expect(distanceXZ(0, 0, 3, 4)).toBe(5);
    expect(getSpatialCellKey(0, 0)).toBe('0:0');
    expect(getSpatialCellKey(65, -1)).toBe('1:-1');
  });
});
