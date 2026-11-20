import { MISSION_LIST, MISSIONS } from '../constants/index.js';
import type {
  EnemyArchetypeId,
  MissionId,
  MissionProgressState,
  PlanetId
} from '../types/index.js';

export function createInitialMissions(): MissionProgressState[] {
  return MISSION_LIST.map((m) => ({
    missionId: m.id,
    progress: 0,
    targetCount: m.targetCount,
    completed: false,
    claimed: false
  }));
}

export interface MissionProgressEvent {
  readonly kind: 'kill' | 'cryonite';
  readonly planetId: PlanetId;
  readonly archetypeId?: EnemyArchetypeId;
  readonly amount: number;
}

/**
 * Avanza progreso de misiones de forma pura y determinista.
 */
export function advanceMissions(
  missions: readonly MissionProgressState[],
  event: MissionProgressEvent
): MissionProgressState[] {
  return missions.map((state) => {
    if (state.claimed || state.completed) return state;
    const def = MISSIONS[state.missionId];
    if (!def) return state;

    if (def.planetId !== 'any' && def.planetId !== event.planetId) {
      return state;
    }

    let delta = 0;
    if (event.kind === 'kill') {
      if (def.objectiveKind === 'kill_any_planet') {
        delta = event.amount;
      } else if (
        def.objectiveKind === 'kill_archetype' &&
        def.targetArchetypeId === event.archetypeId
      ) {
        delta = event.amount;
      }
    } else if (
      event.kind === 'cryonite' &&
      def.objectiveKind === 'collect_cryonite'
    ) {
      delta = event.amount;
    }

    if (delta <= 0) return state;

    const nextProgress = Math.min(def.targetCount, state.progress + delta);
    return {
      ...state,
      progress: nextProgress,
      completed: nextProgress >= def.targetCount
    };
  });
}

export function canClaimMission(
  missions: readonly MissionProgressState[],
  missionId: MissionId
): boolean {
  const target = missions.find((m) => m.missionId === missionId);
  return Boolean(target && target.completed && !target.claimed);
}
