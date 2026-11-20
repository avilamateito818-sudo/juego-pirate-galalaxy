import type { PlanetId, ShipMovementConfig } from '../types/index.js';

export const SIMULATION_CONSTANTS = {
  TICK_RATE_HZ: 20,
  FIXED_DT_SECONDS: 1 / 20,
  MAX_DELTA_MS: 250,
  CLIENT_INPUT_SEND_HZ: 20,
  AOI_CELL_SIZE: 64
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
  baseSpeed: 22,
  afterburnerMultiplier: 1.6,
  hoverHeight: 4.5
};

export const STARTER_BLASTER = {
  id: 'vega_ion_blaster_mk1',
  slot: 1,
  baseDamage: 18,
  range: 45,
  energyCost: 4,
  cooldownMs: 1000,
  critChance: 0.1,
  critMultiplier: 1.5
} as const;
