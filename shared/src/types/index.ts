export type PlanetId = 'vega_kalabesh';

export interface Vec2 {
  readonly x: number;
  readonly z: number;
}

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface MovementInput {
  readonly seq: number;
  readonly moveX: number;
  readonly moveZ: number;
  readonly afterburner: boolean;
}

export interface ShipTransform {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
}

export interface ShipMovementConfig {
  readonly baseSpeed: number;
  readonly afterburnerMultiplier: number;
  readonly hoverHeight: number;
}

export interface DamageInput {
  readonly rawDamage: number;
  readonly currentShield: number;
  readonly currentHull: number;
  readonly critChance: number;
  readonly critMultiplier: number;
  /** Valor determinista en [0, 1) provisto exclusivamente por /server (o test). */
  readonly rngRoll: number;
}

export interface DamageResult {
  readonly finalDamage: number;
  readonly isCrit: boolean;
  readonly shieldAbsorbed: number;
  readonly hullDamage: number;
  readonly remainingShield: number;
  readonly remainingHull: number;
  readonly destroyed: boolean;
}

export const NETWORK_MESSAGES = {
  PLAYER_INPUT: 'player_input',
  SELECT_TARGET: 'select_target',
  CAST_ABILITY: 'cast_ability'
} as const;
