export type PlanetId = 'vega_kalabesh' | 'vega_aurora';

export type ShipModelId = 'vega_scout' | 'vega_storm' | 'vega_tank';

export type AbilitySlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type AbilityId =
  | 'blaster'
  | 'collector'
  | 'repair'
  | 'afterburner'
  | 'shield'
  | 'missile'
  | 'pulse'
  | 'orbit';

export type EnemyArchetypeId =
  | 'mantis_scout'
  | 'mantis_interceptor'
  | 'mantis_harvester';

export type EnemyAiState = 'patrol' | 'chase' | 'attack';

export type LootKind = 'cryonite' | 'energy' | 'blueprint';

export type MissionId =
  | 'mission_kalabesh_patrol'
  | 'mission_cryonite_harvest'
  | 'mission_harvester_hunt'
  | 'mission_aurora_expedition';

export type MissionObjectiveKind =
  | 'kill_any_planet'
  | 'collect_cryonite'
  | 'kill_archetype';

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

export interface SelectTargetInput {
  readonly targetId: string | null;
}

export interface CastAbilityInput {
  readonly slot: AbilitySlot;
  readonly targetId?: string;
}

export interface BuyShipInput {
  readonly shipModelId: ShipModelId;
}

export interface ClaimMissionInput {
  readonly missionId: MissionId;
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

export interface ShipModelSpec {
  readonly id: ShipModelId;
  readonly name: string;
  readonly role: string;
  readonly description: string;
  readonly costCryonite: number;
  readonly hullMax: number;
  readonly shieldMax: number;
  readonly damageMultiplier: number;
  readonly color: string;
  readonly accentColor: string;
  readonly movement: ShipMovementConfig;
}

export interface AbilityConfig {
  readonly slot: AbilitySlot;
  readonly id: AbilityId;
  readonly name: string;
  readonly shortLabel: string;
  readonly range: number;
  readonly energyCost: number;
  readonly cooldownMs: number;
  readonly baseDamage: number;
  readonly repairAmount: number;
  readonly shieldRestore: number;
  readonly requiresTarget: boolean;
  readonly critChance: number;
  readonly critMultiplier: number;
}

export interface EnemyArchetype {
  readonly id: EnemyArchetypeId;
  readonly name: string;
  readonly level: number;
  readonly hullMax: number;
  readonly shieldMax: number;
  readonly speed: number;
  readonly aggroRange: number;
  readonly attackRange: number;
  readonly damage: number;
  readonly attackCooldownMs: number;
  readonly cryoniteReward: number;
  readonly energyDropAmount: number;
  readonly blueprintDropChance: number;
  readonly hoverHeight: number;
  readonly scale: number;
  readonly color: string;
}

export interface MissionDefinition {
  readonly id: MissionId;
  readonly title: string;
  readonly description: string;
  readonly planetId: PlanetId | 'any';
  readonly objectiveKind: MissionObjectiveKind;
  readonly targetArchetypeId?: EnemyArchetypeId;
  readonly targetCount: number;
  readonly rewardCryonite: number;
  readonly rewardBlueprints: number;
}

export interface MissionProgressState {
  readonly missionId: MissionId;
  readonly progress: number;
  readonly targetCount: number;
  readonly completed: boolean;
  readonly claimed: boolean;
}

export interface AuthPilotProfile {
  readonly id: string;
  readonly callsign: string;
  readonly email: string;
  readonly cryonite: number;
  readonly blueprints: number;
  readonly kills: number;
  readonly activePlanet: PlanetId;
  readonly activeShipModelId: ShipModelId;
  readonly ownedShips: readonly ShipModelId[];
  readonly missions: readonly MissionProgressState[];
}

export interface AuthResponse {
  readonly token: string;
  readonly pilot: AuthPilotProfile;
  readonly persistenceMode: 'postgresql' | 'memory-fallback';
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

export type CastRejectReason =
  | 'dead'
  | 'in_orbit'
  | 'cooldown'
  | 'energy'
  | 'no_target'
  | 'out_of_range';

export interface CanCastInput {
  readonly ability: AbilityConfig;
  readonly nowMs: number;
  readonly cooldownUntilMs: number;
  readonly currentEnergy: number;
  readonly isAlive: boolean;
  readonly inOrbit: boolean;
  readonly hasValidTarget: boolean;
  readonly distanceToTarget: number;
}

export type CanCastResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: CastRejectReason };

export interface CombatEvent {
  readonly kind:
    | 'laser_shot'
    | 'missile_hit'
    | 'emp_pulse'
    | 'repair_pulse'
    | 'shield_pulse'
    | 'explosion'
    | 'loot_collected'
    | 'mission_claimed'
    | 'ability_rejected';
  readonly sourceId: string;
  readonly targetId?: string;
  readonly fromX: number;
  readonly fromY: number;
  readonly fromZ: number;
  readonly toX?: number;
  readonly toY?: number;
  readonly toZ?: number;
  readonly amount?: number;
  readonly isCrit?: boolean;
  readonly isEnemy?: boolean;
  readonly color?: string;
  readonly message?: string;
}

export const NETWORK_MESSAGES = {
  PLAYER_INPUT: 'player_input',
  SELECT_TARGET: 'select_target',
  CAST_ABILITY: 'cast_ability',
  BUY_SHIP: 'buy_ship',
  CLAIM_MISSION: 'claim_mission',
  COMBAT_EVENT: 'combat_event'
} as const;
