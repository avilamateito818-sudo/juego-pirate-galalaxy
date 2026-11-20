import {
  ABILITIES,
  DEFAULT_LOADOUT,
  TECH_MODULES,
  TECH_MODULE_LIST
} from '../constants/index.js';
import type {
  AbilitySlot,
  BlueprintProgress,
  EffectiveAbilityConfig,
  EquipableSlot,
  EquippedLoadout,
  TechModuleId
} from '../types/index.js';

export function isEquipableSlot(slot: AbilitySlot): slot is EquipableSlot {
  return slot === 1 || slot === 3 || slot === 5 || slot === 6 || slot === 7;
}

export function isValidTechModuleId(value: string): value is TechModuleId {
  return value in TECH_MODULES;
}

export function createInitialTechProgress(): BlueprintProgress[] {
  return TECH_MODULE_LIST.map((mod) => ({
    blueprintId: mod.id,
    collected: mod.requiredBlueprints,
    required: mod.requiredBlueprints,
    unlocked: mod.requiredBlueprints === 0,
    crafted: mod.costCryonite === 0 && mod.requiredBlueprints === 0
  })).map((entry) =>
    entry.required > 0
      ? { ...entry, collected: 0, unlocked: false, crafted: false }
      : entry
  );
}

/**
 * Resuelve estadísticas efectivas de una habilidad combinando base + tecnología equipada.
 * Función pura determinista usada idénticamente por /server y /client.
 */
export function resolveEffectiveAbility(
  slot: AbilitySlot,
  loadout: EquippedLoadout = DEFAULT_LOADOUT
): EffectiveAbilityConfig {
  const base = ABILITIES[slot];
  if (!isEquipableSlot(slot)) {
    return {
      ...base,
      tier: 1,
      beamColor: '#22d3ee'
    };
  }

  const techId = loadout[slot] ?? DEFAULT_LOADOUT[slot];
  const spec = TECH_MODULES[techId];
  if (!spec || spec.slot !== slot) {
    return {
      ...base,
      tier: 1,
      beamColor: '#22d3ee'
    };
  }

  return {
    ...base,
    ...spec.overrides,
    name: spec.name,
    shortLabel: spec.shortLabel,
    techId: spec.id,
    tier: spec.tier,
    beamColor: spec.beamColor
  };
}

/**
 * Suma una pieza de plano recogida y determina si desbloqueó la tecnología ahora.
 */
export function addBlueprintPiece(
  progress: readonly BlueprintProgress[],
  techId: TechModuleId
): { readonly next: BlueprintProgress[]; readonly unlockedNow: boolean } {
  let unlockedNow = false;
  const next = progress.map((entry) => {
    if (entry.blueprintId !== techId) return entry;
    if (entry.unlocked) return entry;
    const collected = Math.min(entry.required, entry.collected + 1);
    const unlocked = collected >= entry.required;
    if (unlocked) unlockedNow = true;
    return { ...entry, collected, unlocked };
  });

  return { next, unlockedNow };
}

export type CraftOrEquipCheck =
  | { readonly ok: true; readonly action: 'equip' | 'craft_and_equip'; readonly cost: number }
  | { readonly ok: false; readonly reason: 'not_found' | 'locked' | 'cryonite' };

/**
 * Valida si un piloto puede fabricar/equipar una tecnología en el Hangar.
 */
export function canCraftOrEquipTech(
  progress: readonly BlueprintProgress[],
  techId: TechModuleId,
  currentCryonite: number
): CraftOrEquipCheck {
  const spec = TECH_MODULES[techId];
  if (!spec) return { ok: false, reason: 'not_found' };

  const state = progress.find((p) => p.blueprintId === techId);
  if (!state || !state.unlocked) {
    return { ok: false, reason: 'locked' };
  }

  if (state.crafted || spec.costCryonite === 0) {
    return { ok: true, action: 'equip', cost: 0 };
  }

  if (currentCryonite < spec.costCryonite) {
    return { ok: false, reason: 'cryonite' };
  }

  return { ok: true, action: 'craft_and_equip', cost: spec.costCryonite };
}

/**
 * Selecciona determinísticamente un plano del pool de un enemigo usando rngRoll en [0, 1).
 */
export function pickBlueprintDrop(
  dropPool: readonly TechModuleId[],
  rngRoll: number
): TechModuleId {
  if (dropPool.length === 0) return 'blaster_mk2';
  const clamped = Math.max(0, Math.min(0.999999, rngRoll));
  const idx = Math.floor(clamped * dropPool.length);
  return dropPool[idx] ?? 'blaster_mk2';
}

export function sanitizeLoadout(raw: unknown): EquippedLoadout {
  const result: EquippedLoadout = { ...DEFAULT_LOADOUT };
  if (typeof raw !== 'object' || raw === null) return result;
  const obj = raw as Record<string, unknown>;

  for (const slot of [1, 3, 5, 6, 7] as const) {
    const candidate = obj[String(slot)];
    if (
      typeof candidate === 'string' &&
      isValidTechModuleId(candidate) &&
      TECH_MODULES[candidate].slot === slot
    ) {
      result[slot] = candidate;
    }
  }
  return result;
}
