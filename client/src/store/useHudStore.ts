import { create } from 'zustand';
import type { PlanetId, ShipModelId } from '@starcorsair/shared';

export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'error';

export interface TargetHudSummary {
  id: string;
  name: string;
  level: number;
  hull: number;
  hullMax: number;
  shield: number;
  shieldMax: number;
  distance: number;
}

export interface CombatLogEntry {
  id: number;
  text: string;
  tone: 'info' | 'crit' | 'loot' | 'warn';
}

export interface CooldownsState {
  cd1: number;
  cd2: number;
  cd3: number;
  cd5: number;
  cd6: number;
  cd7: number;
  cd8: number;
}

interface HudState {
  planetId: PlanetId;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  sessionId: string | null;
  playerCount: number;
  enemyVersion: number;
  dropVersion: number;
  shipModelId: ShipModelId;
  hull: number;
  hullMax: number;
  shield: number;
  shieldMax: number;
  energy: number;
  energyMax: number;
  cryonite: number;
  blueprints: number;
  kills: number;
  alive: boolean;
  inOrbit: boolean;
  afterburnerActive: boolean;
  target: TargetHudSummary | null;
  cooldowns: CooldownsState;
  combatLog: CombatLogEntry[];
  muted: boolean;
  setConnection: (
    status: ConnectionStatus,
    sessionId?: string | null,
    error?: string | null
  ) => void;
  setPlayerCount: (count: number) => void;
  bumpEnemyVersion: () => void;
  bumpDropVersion: () => void;
  syncLocalHud: (patch: {
    shipModelId: ShipModelId;
    hull: number;
    hullMax: number;
    shield: number;
    shieldMax: number;
    energy: number;
    cryonite: number;
    blueprints: number;
    kills: number;
    alive: boolean;
    inOrbit: boolean;
    cooldowns: CooldownsState;
    target: TargetHudSummary | null;
  }) => void;
  setAfterburnerActive: (active: boolean) => void;
  pushLog: (text: string, tone?: CombatLogEntry['tone']) => void;
  toggleMuted: () => void;
}

let logIdSeq = 1;

export const useHudStore = create<HudState>((set) => ({
  planetId: 'vega_kalabesh',
  connectionStatus: 'offline',
  connectionError: null,
  sessionId: null,
  playerCount: 0,
  enemyVersion: 0,
  dropVersion: 0,
  shipModelId: 'vega_scout',
  hull: 110,
  hullMax: 110,
  shield: 60,
  shieldMax: 60,
  energy: 100,
  energyMax: 100,
  cryonite: 0,
  blueprints: 0,
  kills: 0,
  alive: true,
  inOrbit: false,
  afterburnerActive: false,
  target: null,
  cooldowns: { cd1: 0, cd2: 0, cd3: 0, cd5: 0, cd6: 0, cd7: 0, cd8: 0 },
  combatLog: [
    {
      id: 0,
      text: 'Bienvenido a Kalabesh. Fija un Mantis (clic o Tab) y dispara con [1] o [6].',
      tone: 'info'
    }
  ],
  muted: false,
  setConnection: (connectionStatus, sessionId = null, connectionError = null) =>
    set({ connectionStatus, sessionId, connectionError }),
  setPlayerCount: (playerCount) => set({ playerCount }),
  bumpEnemyVersion: () => set((s) => ({ enemyVersion: s.enemyVersion + 1 })),
  bumpDropVersion: () => set((s) => ({ dropVersion: s.dropVersion + 1 })),
  syncLocalHud: (patch) => set(patch),
  setAfterburnerActive: (afterburnerActive) => set({ afterburnerActive }),
  pushLog: (text, tone = 'info') =>
    set((s) => ({
      combatLog: [{ id: logIdSeq++, text, tone }, ...s.combatLog].slice(0, 5)
    })),
  toggleMuted: () => set((s) => ({ muted: !s.muted }))
}));
