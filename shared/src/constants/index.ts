import type {
  AbilityConfig,
  AbilitySlot,
  EnemyArchetype,
  EnemyArchetypeId,
  PlanetId,
  ShipModelId,
  ShipModelSpec,
  ShipMovementConfig
} from '../types/index.js';

export const SIMULATION_CONSTANTS = {
  TICK_RATE_HZ: 20,
  FIXED_DT_SECONDS: 1 / 20,
  MAX_DELTA_MS: 250,
  CLIENT_INPUT_SEND_HZ: 20,
  AOI_CELL_SIZE: 64
} as const;

export const ENERGY_CONSTANTS = {
  MAX_ENERGY: 100,
  PASSIVE_REGEN_PER_SEC: 4.5,
  AFTERBURNER_COST_PER_SEC: 9,
  PLAYER_RESPAWN_MS: 4000,
  ENEMY_RESPAWN_MS: 9000,
  LOOT_LIFETIME_MS: 45000,
  SAFE_ZONE_RADIUS: 24
} as const;

export interface PlanetConfig {
  readonly id: PlanetId;
  readonly name: string;
  readonly halfSize: number;
  readonly spawnPoint: { readonly x: number; readonly z: number };
}

export const PLANETS: Record<PlanetId, PlanetConfig> = {
  vega_kalabesh: {
    id: 'vega_kalabesh',
    name: 'Kalabesh (Sistema Vega)',
    halfSize: 240,
    spawnPoint: { x: 0, z: 0 }
  }
};

export const STARTER_SHIP_MOVEMENT: ShipMovementConfig = {
  baseSpeed: 24,
  afterburnerMultiplier: 1.65,
  hoverHeight: 4.5
};

export const HANGAR_SHIPS: Record<ShipModelId, ShipModelSpec> = {
  vega_scout: {
    id: 'vega_scout',
    name: 'Vega Interceptor Mk-I',
    role: 'Explorador Ágil',
    description: 'Nave inicial rápida y equilibrada para patrullas en superficie.',
    costCryonite: 0,
    hullMax: 110,
    shieldMax: 60,
    damageMultiplier: 1.0,
    color: '#38bdf8',
    accentColor: '#22d3ee',
    movement: STARTER_SHIP_MOVEMENT
  },
  vega_storm: {
    id: 'vega_storm',
    name: 'Vega Storm-X',
    role: 'Asalto de Alto Daño',
    description: 'Potencia de fuego +35% en bláster, cohetes y pulso EMP.',
    costCryonite: 120,
    hullMax: 135,
    shieldMax: 85,
    damageMultiplier: 1.35,
    color: '#f97316',
    accentColor: '#fb923c',
    movement: {
      baseSpeed: 26,
      afterburnerMultiplier: 1.7,
      hoverHeight: 4.5
    }
  },
  vega_tank: {
    id: 'vega_tank',
    name: 'Vega Bastion Heavy',
    role: 'Acorazado Planetario',
    description: 'Blindaje reforzado y escudo pesado para cazar Cosechadores Mantis.',
    costCryonite: 240,
    hullMax: 210,
    shieldMax: 140,
    damageMultiplier: 1.18,
    color: '#a855f7',
    accentColor: '#c084fc',
    movement: {
      baseSpeed: 21,
      afterburnerMultiplier: 1.55,
      hoverHeight: 4.8
    }
  }
};

export const ABILITIES: Record<AbilitySlot, AbilityConfig> = {
  1: {
    slot: 1,
    id: 'blaster',
    name: 'Bláster Iónico',
    shortLabel: 'Bláster',
    range: 52,
    energyCost: 4,
    cooldownMs: 850,
    baseDamage: 24,
    repairAmount: 0,
    shieldRestore: 0,
    requiresTarget: true,
    critChance: 0.14,
    critMultiplier: 1.5
  },
  2: {
    slot: 2,
    id: 'collector',
    name: 'Colector Gravitacional',
    shortLabel: 'Colector',
    range: 38,
    energyCost: 0,
    cooldownMs: 1100,
    baseDamage: 0,
    repairAmount: 0,
    shieldRestore: 0,
    requiresTarget: false,
    critChance: 0,
    critMultiplier: 1
  },
  3: {
    slot: 3,
    id: 'repair',
    name: 'Droide Reparador',
    shortLabel: 'Reparador',
    range: 0,
    energyCost: 16,
    cooldownMs: 6500,
    baseDamage: 0,
    repairAmount: 40,
    shieldRestore: 0,
    requiresTarget: false,
    critChance: 0,
    critMultiplier: 1
  },
  4: {
    slot: 4,
    id: 'afterburner',
    name: 'Postquemador (Shift)',
    shortLabel: 'Postq.',
    range: 0,
    energyCost: 0,
    cooldownMs: 0,
    baseDamage: 0,
    repairAmount: 0,
    shieldRestore: 0,
    requiresTarget: false,
    critChance: 0,
    critMultiplier: 1
  },
  5: {
    slot: 5,
    id: 'shield',
    name: 'Escudo Deflector',
    shortLabel: 'Escudo',
    range: 0,
    energyCost: 14,
    cooldownMs: 7500,
    baseDamage: 0,
    repairAmount: 0,
    shieldRestore: 40,
    requiresTarget: false,
    critChance: 0,
    critMultiplier: 1
  },
  6: {
    slot: 6,
    id: 'missile',
    name: 'Cohete de Plasma',
    shortLabel: 'Cohete',
    range: 64,
    energyCost: 14,
    cooldownMs: 4200,
    baseDamage: 52,
    repairAmount: 0,
    shieldRestore: 0,
    requiresTarget: true,
    critChance: 0.2,
    critMultiplier: 1.6
  },
  7: {
    slot: 7,
    id: 'pulse',
    name: 'Pulso EMP Radial',
    shortLabel: 'Pulso',
    range: 40,
    energyCost: 20,
    cooldownMs: 9000,
    baseDamage: 36,
    repairAmount: 0,
    shieldRestore: 0,
    requiresTarget: false,
    critChance: 0.1,
    critMultiplier: 1.4
  },
  8: {
    slot: 8,
    id: 'orbit',
    name: 'Órbita / Hangar',
    shortLabel: 'Órbita',
    range: 0,
    energyCost: 0,
    cooldownMs: 1500,
    baseDamage: 0,
    repairAmount: 0,
    shieldRestore: 0,
    requiresTarget: false,
    critChance: 0,
    critMultiplier: 1
  }
};

export const STARTER_BLASTER = ABILITIES[1];

export const ENEMY_ARCHETYPES: Record<EnemyArchetypeId, EnemyArchetype> = {
  mantis_scout: {
    id: 'mantis_scout',
    name: 'Explorador Mantis',
    level: 1,
    hullMax: 65,
    shieldMax: 20,
    speed: 13,
    aggroRange: 44,
    attackRange: 30,
    damage: 9,
    attackCooldownMs: 1600,
    cryoniteReward: 25,
    energyDropAmount: 28,
    blueprintDropChance: 0.25,
    hoverHeight: 4.5,
    scale: 0.95,
    color: '#ef4444'
  },
  mantis_interceptor: {
    id: 'mantis_interceptor',
    name: 'Interceptor Mantis',
    level: 2,
    hullMax: 105,
    shieldMax: 45,
    speed: 16,
    aggroRange: 52,
    attackRange: 34,
    damage: 14,
    attackCooldownMs: 1400,
    cryoniteReward: 45,
    energyDropAmount: 36,
    blueprintDropChance: 0.4,
    hoverHeight: 4.8,
    scale: 1.15,
    color: '#f43f5e'
  },
  mantis_harvester: {
    id: 'mantis_harvester',
    name: 'Cosechador Mantis',
    level: 3,
    hullMax: 220,
    shieldMax: 90,
    speed: 9,
    aggroRange: 56,
    attackRange: 38,
    damage: 20,
    attackCooldownMs: 1850,
    cryoniteReward: 110,
    energyDropAmount: 60,
    blueprintDropChance: 0.85,
    hoverHeight: 5.8,
    scale: 1.75,
    color: '#c026d3'
  }
};
