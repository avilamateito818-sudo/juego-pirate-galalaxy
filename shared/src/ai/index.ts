import { distanceXZ } from '../combat/index.js';
import { ENERGY_CONSTANTS, PLANETS } from '../constants/index.js';
import { getTerrainHeight } from '../terrain/index.js';
import type { EnemyAiState, EnemyArchetype, PlanetId } from '../types/index.js';

export interface EnemyStepInput {
  readonly x: number;
  readonly z: number;
  readonly yaw: number;
  readonly homeX: number;
  readonly homeZ: number;
  readonly patrolPhase: number;
  readonly archetype: EnemyArchetype;
  readonly planetId: PlanetId;
  readonly dtSeconds: number;
  readonly targetPlayer: { readonly x: number; readonly z: number } | null;
}

export interface EnemyStepOutput {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
  readonly patrolPhase: number;
  readonly aiState: EnemyAiState;
  readonly inAttackRange: boolean;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Lógica pura y determinista de movimiento/comportamiento de enemigos IA sobre terreno planetario.
 */
export function stepEnemyAI(input: EnemyStepInput): EnemyStepOutput {
  const safeDt = clamp(Number.isFinite(input.dtSeconds) ? input.dtSeconds : 0, 0, 0.25);
  const { archetype, planetId } = input;
  const halfSize = PLANETS[planetId].halfSize - 8;

  let desiredX = input.x;
  let desiredZ = input.z;
  let nextPhase = input.patrolPhase + safeDt * 0.45;
  let aiState: EnemyAiState = 'patrol';
  let inAttackRange = false;

  const target = input.targetPlayer;
  const targetInSafeZone =
    target !== null &&
    distanceXZ(target.x, target.z, 0, 0) <= ENERGY_CONSTANTS.SAFE_ZONE_RADIUS;

  if (target && !targetInSafeZone) {
    const dist = distanceXZ(input.x, input.z, target.x, target.z);
    if (dist <= archetype.attackRange) {
      aiState = 'attack';
      inAttackRange = true;
      // Órbita táctica suave alrededor del objetivo sin chocar
      const angleToPlayer = Math.atan2(target.x - input.x, target.z - input.z);
      const orbitAngle = angleToPlayer + Math.PI * 0.5;
      const strafeSpeed = archetype.speed * 0.45;
      desiredX = input.x + Math.sin(orbitAngle) * strafeSpeed * safeDt;
      desiredZ = input.z + Math.cos(orbitAngle) * strafeSpeed * safeDt;
    } else if (dist <= archetype.aggroRange) {
      aiState = 'chase';
      const inv = 1 / Math.max(1e-6, dist);
      desiredX = input.x + (target.x - input.x) * inv * archetype.speed * safeDt;
      desiredZ = input.z + (target.z - input.z) * inv * archetype.speed * safeDt;
    }
  }

  if (aiState === 'patrol') {
    const patrolRadius = 18;
    const goalX = input.homeX + Math.cos(nextPhase) * patrolRadius;
    const goalZ = input.homeZ + Math.sin(nextPhase) * patrolRadius;
    const distGoal = distanceXZ(input.x, input.z, goalX, goalZ);
    const patrolSpeed = archetype.speed * 0.65;
    if (distGoal > 0.5) {
      const step = Math.min(distGoal, patrolSpeed * safeDt);
      desiredX = input.x + ((goalX - input.x) / distGoal) * step;
      desiredZ = input.z + ((goalZ - input.z) / distGoal) * step;
    }
  }

  // Impide que los enemigos entren en la zona segura de aterrizaje
  const distFromOrigin = distanceXZ(desiredX, desiredZ, 0, 0);
  const minOriginDist = ENERGY_CONSTANTS.SAFE_ZONE_RADIUS + 6;
  if (distFromOrigin < minOriginDist && distFromOrigin > 1e-6) {
    desiredX = (desiredX / distFromOrigin) * minOriginDist;
    desiredZ = (desiredZ / distFromOrigin) * minOriginDist;
  }

  const nextX = clamp(desiredX, -halfSize, halfSize);
  const nextZ = clamp(desiredZ, -halfSize, halfSize);
  const nextY = getTerrainHeight(planetId, nextX, nextZ) + archetype.hoverHeight;

  let nextYaw = input.yaw;
  if (aiState === 'attack' && target) {
    nextYaw = Math.atan2(target.x - nextX, target.z - nextZ);
  } else {
    const dx = nextX - input.x;
    const dz = nextZ - input.z;
    if (Math.hypot(dx, dz) > 1e-4) {
      nextYaw = Math.atan2(dx, dz);
    }
  }

  if (nextPhase > Math.PI * 200) {
    nextPhase -= Math.PI * 200;
  }

  return {
    x: nextX,
    y: nextY,
    z: nextZ,
    yaw: nextYaw,
    patrolPhase: nextPhase,
    aiState,
    inAttackRange
  };
}
