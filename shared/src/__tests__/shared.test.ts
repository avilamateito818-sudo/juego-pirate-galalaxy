import { describe, expect, it } from 'vitest';
import {
  PLANETS,
  SIMULATION_CONSTANTS,
  STARTER_SHIP_MOVEMENT,
  getSpatialCellKey,
  getTerrainHeight,
  resolveDamage,
  stepShipMovement
} from '../index.js';

describe('@starcorsair/shared — Determinismo y funciones puras', () => {
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
    // Normaliza diagonal para evitar speed-hack en 45 grados
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

  it('calcula claves espaciales AOI deterministas', () => {
    expect(getSpatialCellKey(0, 0)).toBe('0:0');
    expect(getSpatialCellKey(65, -1)).toBe('1:-1');
  });
});
