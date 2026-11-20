import { PLANETS } from '../constants/index.js';
import { getTerrainHeight } from '../terrain/index.js';
import type {
  MovementInput,
  PlanetId,
  ShipMovementConfig,
  ShipTransform
} from '../types/index.js';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Integración cinemática pura y determinista sobre superficie planetaria.
 * Usada por /client (predicción) y /server (autoridad).
 */
export function stepShipMovement(
  current: ShipTransform,
  input: MovementInput,
  config: ShipMovementConfig,
  planetId: PlanetId,
  dtSeconds: number
): ShipTransform {
  const safeDt = clamp(Number.isFinite(dtSeconds) ? dtSeconds : 0, 0, 0.25);
  const rawX = Number.isFinite(input.moveX) ? input.moveX : 0;
  const rawZ = Number.isFinite(input.moveZ) ? input.moveZ : 0;

  const length = Math.hypot(rawX, rawZ);
  const dirX = length > 1e-6 ? rawX / Math.max(1, length) : 0;
  const dirZ = length > 1e-6 ? rawZ / Math.max(1, length) : 0;

  const speed =
    config.baseSpeed * (input.afterburner ? config.afterburnerMultiplier : 1);

  const halfSize = PLANETS[planetId].halfSize;
  const nextX = clamp(current.x + dirX * speed * safeDt, -halfSize, halfSize);
  const nextZ = clamp(current.z + dirZ * speed * safeDt, -halfSize, halfSize);
  const groundY = getTerrainHeight(planetId, nextX, nextZ);
  const nextY = groundY + config.hoverHeight;
  const nextYaw = length > 1e-6 ? Math.atan2(dirX, dirZ) : current.yaw;

  return {
    x: nextX,
    y: nextY,
    z: nextZ,
    yaw: nextYaw
  };
}
