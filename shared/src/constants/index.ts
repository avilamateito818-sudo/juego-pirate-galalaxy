import type {
  AbilityConfig,
  AbilitySlot,
  EnemyArchetype,
  EnemyArchetypeId,
  EquippedLoadout,
  MissionDefinition,
  MissionId,
  PlanetId,
  ShipModelId,
  ShipModelSpec,
  ShipMovementConfig,
  TechModuleId,
  TechModuleSpec
} from '../types/index.js';

export const SIMULATION_CONSTANTS = {
  TICK_RATE_HZ: 20,
  FIXED_DT_SECONDS: 1 / 20,
  MAX_DELTA_MS: 250,
  CLIENT_INPUT_SEND_HZ: 20,
  AOI_CELL_SIZE: 64,
  AUTOSAVE_INTERVAL_MS: 30_000
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
  readonly systemName: string;
  readonly dangerLevel: string;
  readonly description: string;
  readonly halfSize: number;
  readonly spawnPoint: { readonly x: number; readonly z: number };
  readonly visual: {
    readonly skyColor: string;
    readonly fogColor: string;
    readonly lowColor: string;
    readonly midColor: string;
    readonly highColor: string;
    readonly padColor: string;
    readonly rockColor: string;
    readonly accentColor: string;
  };
}

export const PLANETS: Record<PlanetId, PlanetConfig> = {
  vega_kalabesh: {
    id: 'vega_kalabesh',
    name: 'Kalabesh',
    systemName: 'Sistema Vega',
    dangerLevel: 'Nivel 1–3 • Sector Inicial',
    description:
      'Planeta fronterizo de colinas metálicas con patrullas de Exploradores e Interceptores Mantis.',
    halfSize: 240,
    spawnPoint: { x: 0, z: 0 },
    visual: {
      skyColor: '#040814',
      fogColor: '#040814',
      lowColor: '#1f2f40',
      midColor: '#3c5263',
      highColor: '#64748b',
      padColor: '#27394d',
      rockColor: '#334155',
      accentColor: '#0ea5e9'
    }
  },
  vega_aurora: {
    id: 'vega_aurora',
    name: 'Aurora',
    systemName: 'Sistema Vega',
    dangerLevel: 'Nivel 2–4 • Zona Hostil',
    description:
      'Luna volcánica de cañones ámbar rica en Crionita, custodiada por Interceptores y dos Cosechadores Mantis.',
    halfSize: 240,
    spawnPoint: { x: 0, z: 0 },
    visual: {
      skyColor: '#14080a',
      fogColor: '#1c0b0e',
      lowColor: '#3b1d1a',
      midColor: '#6b2f24',
      highColor: '#a14d33',
      padColor: '#45231e',
      rockColor: '#2b1817',
      accentColor: '#f97316'
    }
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

export const DEFAULT_LOADOUT: EquippedLoadout = {
  1: 'blaster_mk1',
  3: 'repair_mk1',
  5: 'shield_mk1',
  6: 'missile_mk1',
  7: 'pulse_mk1'
};

export const TECH_MODULES: Record<TechModuleId, TechModuleSpec> = {
  blaster_mk1: {
    id: 'blaster_mk1',
    slot: 1,
    tier: 1,
    name: 'Bláster Iónico Mk-I',
    shortLabel: 'Bláster I',
    description: 'Cañón estándar de la flota Vega.',
    requiredBlueprints: 0,
    costCryonite: 0,
    beamColor: '#22d3ee',
    overrides: {}
  },
  blaster_mk2: {
    id: 'blaster_mk2',
    slot: 1,
    tier: 2,
    name: 'Bláster Plasma Esmeralda Mk-II',
    shortLabel: 'Bláster II',
    description: '+35% daño, disparos más rápidos (720ms) y haz esmeralda.',
    requiredBlueprints: 1,
    costCryonite: 85,
    beamColor: '#10b981',
    overrides: {
      baseDamage: 33,
      cooldownMs: 720,
      range: 56,
      critChance: 0.18
    }
  },
  blaster_mk3: {
    id: 'blaster_mk3',
    slot: 1,
    tier: 3,
    name: 'Bláster Solar Aurora Mk-III',
    shortLabel: 'Bláster III',
    description: 'Tecnología de élite (+70% daño, haz dorado y 24% crítico).',
    requiredBlueprints: 2,
    costCryonite: 190,
    beamColor: '#facc15',
    overrides: {
      baseDamage: 41,
      cooldownMs: 650,
      range: 60,
      energyCost: 5,
      critChance: 0.24,
      critMultiplier: 1.65
    }
  },
  repair_mk1: {
    id: 'repair_mk1',
    slot: 3,
    tier: 1,
    name: 'Droide Reparador Mk-I',
    shortLabel: 'Repar. I',
    description: 'Reparación básica de casco (+40).',
    requiredBlueprints: 0,
    costCryonite: 0,
    beamColor: '#34d399',
    overrides: {}
  },
  repair_mk2: {
    id: 'repair_mk2',
    slot: 3,
    tier: 2,
    name: 'Nano-Droide Reparador Mk-II',
    shortLabel: 'Repar. II',
    description: 'Repara +70 de casco con menos enfriamiento (5.0s) y menor energía.',
    requiredBlueprints: 1,
    costCryonite: 75,
    beamColor: '#2dd4bf',
    overrides: {
      repairAmount: 70,
      cooldownMs: 5000,
      energyCost: 13
    }
  },
  shield_mk1: {
    id: 'shield_mk1',
    slot: 5,
    tier: 1,
    name: 'Escudo Deflector Mk-I',
    shortLabel: 'Escudo I',
    description: 'Restaura +40 puntos de escudo.',
    requiredBlueprints: 0,
    costCryonite: 0,
    beamColor: '#38bdf8',
    overrides: {}
  },
  shield_mk2: {
    id: 'shield_mk2',
    slot: 5,
    tier: 2,
    name: 'Escudo Cuántico Mk-II',
    shortLabel: 'Escudo II',
    description: 'Restaura +75 de escudo cada 5.8s con menor consumo.',
    requiredBlueprints: 1,
    costCryonite: 80,
    beamColor: '#60a5fa',
    overrides: {
      shieldRestore: 75,
      cooldownMs: 5800,
      energyCost: 12
    }
  },
  missile_mk1: {
    id: 'missile_mk1',
    slot: 6,
    tier: 1,
    name: 'Cohete de Plasma Mk-I',
    shortLabel: 'Cohete I',
    description: 'Proyectil de alto impacto a larga distancia.',
    requiredBlueprints: 0,
    costCryonite: 0,
    beamColor: '#fb923c',
    overrides: {}
  },
  missile_mk2: {
    id: 'missile_mk2',
    slot: 6,
    tier: 2,
    name: 'Cohete Termobárico Mk-II',
    shortLabel: 'Cohete II',
    description: 'Daño devastador (76), alcance 72m y estela carmesí.',
    requiredBlueprints: 1,
    costCryonite: 110,
    beamColor: '#f43f5e',
    overrides: {
      baseDamage: 76,
      range: 72,
      cooldownMs: 3600,
      critChance: 0.25
    }
  },
  pulse_mk1: {
    id: 'pulse_mk1',
    slot: 7,
    tier: 1,
    name: 'Pulso EMP Radial Mk-I',
    shortLabel: 'Pulso I',
    description: 'Onda electromagnética estándar en 40m.',
    requiredBlueprints: 0,
    costCryonite: 0,
    beamColor: '#a855f7',
    overrides: {}
  },
  pulse_mk2: {
    id: 'pulse_mk2',
    slot: 7,
    tier: 2,
    name: 'Onda EMP Sobrecargada Mk-II',
    shortLabel: 'Pulso II',
    description: 'Impacta en 48m con 54 de daño y enfriamiento reducido (7.2s).',
    requiredBlueprints: 1,
    costCryonite: 125,
    beamColor: '#e879f9',
    overrides: {
      baseDamage: 54,
      range: 48,
      cooldownMs: 7200,
      energyCost: 18
    }
  }
};

export const TECH_MODULE_LIST: readonly TechModuleSpec[] = Object.values(TECH_MODULES);

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
    blueprintDropChance: 0.35,
    dropPool: ['blaster_mk2', 'repair_mk2', 'shield_mk2'],
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
    blueprintDropChance: 0.48,
    dropPool: ['blaster_mk2', 'missile_mk2', 'pulse_mk2', 'shield_mk2'],
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
    blueprintDropChance: 0.9,
    dropPool: ['blaster_mk3', 'missile_mk2', 'pulse_mk2'],
    hoverHeight: 5.8,
    scale: 1.75,
    color: '#c026d3'
  }
};

export const MISSIONS: Record<MissionId, MissionDefinition> = {
  mission_kalabesh_patrol: {
    id: 'mission_kalabesh_patrol',
    title: 'Limpieza de Kalabesh',
    description: 'Destruye 3 naves Mantis sobre la superficie de Kalabesh.',
    planetId: 'vega_kalabesh',
    objectiveKind: 'kill_any_planet',
    targetCount: 3,
    rewardCryonite: 80,
    rewardBlueprints: 1
  },
  mission_cryonite_harvest: {
    id: 'mission_cryonite_harvest',
    title: 'Extracción de Crionita',
    description: 'Recolecta 100 unidades de Crionita usando el Colector [2].',
    planetId: 'any',
    objectiveKind: 'collect_cryonite',
    targetCount: 100,
    rewardCryonite: 90,
    rewardBlueprints: 0
  },
  mission_harvester_hunt: {
    id: 'mission_harvester_hunt',
    title: 'Caza del Cosechador',
    description: 'Destruye 1 Cosechador Mantis (Minijefe violeta).',
    planetId: 'any',
    objectiveKind: 'kill_archetype',
    targetArchetypeId: 'mantis_harvester',
    targetCount: 1,
    rewardCryonite: 180,
    rewardBlueprints: 2
  },
  mission_aurora_expedition: {
    id: 'mission_aurora_expedition',
    title: 'Expedición a Aurora',
    description: 'Viaja al planeta Aurora (Órbita [8] → Mapa Estelar) y destruye 4 Mantis.',
    planetId: 'vega_aurora',
    objectiveKind: 'kill_any_planet',
    targetCount: 4,
    rewardCryonite: 220,
    rewardBlueprints: 2
  }
};

export const MISSION_LIST: readonly MissionDefinition[] = Object.values(MISSIONS);
