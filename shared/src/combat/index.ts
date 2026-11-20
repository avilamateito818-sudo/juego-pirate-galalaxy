import type { DamageInput, DamageResult } from '../types/index.js';

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
