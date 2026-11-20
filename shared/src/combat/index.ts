import { ENERGY_CONSTANTS } from '../constants/index.js';
import type {
  CanCastInput,
  CanCastResult,
  DamageInput,
  DamageResult
} from '../types/index.js';

export function distanceXZ(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(bx - ax, bz - az);
}

/**
 * Validación pura de precondiciones para activar una habilidad 1–8.
 * Usada por /server (autoridad) y /client (feedback de UI/rango).
 */
export function canCastAbility(input: CanCastInput): CanCastResult {
  if (!input.isAlive) {
    return { ok: false, reason: 'dead' };
  }
  if (input.inOrbit && input.ability.id !== 'orbit') {
    return { ok: false, reason: 'in_orbit' };
  }
  if (input.nowMs < input.cooldownUntilMs) {
    return { ok: false, reason: 'cooldown' };
  }
  if (input.currentEnergy < input.ability.energyCost) {
    return { ok: false, reason: 'energy' };
  }
  if (input.ability.requiresTarget) {
    if (!input.hasValidTarget) {
      return { ok: false, reason: 'no_target' };
    }
    if (input.distanceToTarget > input.ability.range) {
      return { ok: false, reason: 'out_of_range' };
    }
  }
  return { ok: true };
}

/**
 * Resolución pura y determinista de daño (escudo -> casco).
 * El servidor pasa rngRoll; el cliente nunca aplica resultados definitivos por su cuenta.
 */
export function resolveDamage(input: DamageInput): DamageResult {
  const safeRaw = Math.max(0, Number.isFinite(input.rawDamage) ? input.rawDamage : 0);
  const safeShield = Math.max(0, input.currentShield);
  const safeHull = Math.max(0, input.currentHull);

  const isCrit = input.rngRoll < input.critChance;
  const finalDamage = Math.round(safeRaw * (isCrit ? input.critMultiplier : 1));

  const shieldAbsorbed = Math.min(safeShield, finalDamage);
  const remainingShield = safeShield - shieldAbsorbed;

  const overflowDamage = finalDamage - shieldAbsorbed;
  const hullDamage = Math.min(safeHull, overflowDamage);
  const remainingHull = safeHull - hullDamage;

  return {
    finalDamage,
    isCrit,
    shieldAbsorbed,
    hullDamage,
    remainingShield,
    remainingHull,
    destroyed: remainingHull <= 0
  };
}

export function resolveRepair(
  currentHull: number,
  hullMax: number,
  amount: number
): { readonly newHull: number; readonly repaired: number } {
  const clampedCurrent = Math.max(0, Math.min(hullMax, currentHull));
  const newHull = Math.min(hullMax, clampedCurrent + Math.max(0, amount));
  return { newHull, repaired: newHull - clampedCurrent };
}

export function resolveShieldRestore(
  currentShield: number,
  shieldMax: number,
  amount: number
): { readonly newShield: number; readonly restored: number } {
  const clampedCurrent = Math.max(0, Math.min(shieldMax, currentShield));
  const newShield = Math.min(shieldMax, clampedCurrent + Math.max(0, amount));
  return { newShield, restored: newShield - clampedCurrent };
}

export function regenEnergy(
  currentEnergy: number,
  dtSeconds: number,
  usingAfterburner: boolean,
  maxEnergy: number = ENERGY_CONSTANTS.MAX_ENERGY
): number {
  const safeDt = Math.max(0, Math.min(0.25, Number.isFinite(dtSeconds) ? dtSeconds : 0));
  const delta = usingAfterburner
    ? -ENERGY_CONSTANTS.AFTERBURNER_COST_PER_SEC * safeDt
    : ENERGY_CONSTANTS.PASSIVE_REGEN_PER_SEC * safeDt;
  return Math.max(0, Math.min(maxEnergy, currentEnergy + delta));
}
