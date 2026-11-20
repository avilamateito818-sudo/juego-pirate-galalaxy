import { create } from 'zustand';
import type { PlanetId } from '@starcorsair/shared';

export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'error';

interface HudState {
  planetId: PlanetId;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  sessionId: string | null;
  playerCount: number;
  hull: number;
  hullMax: number;
  shield: number;
  shieldMax: number;
  energy: number;
  energyMax: number;
  cryonite: number;
  afterburnerActive: boolean;
  setConnection: (
    status: ConnectionStatus,
    sessionId?: string | null,
    error?: string | null
  ) => void;
  setPlayerCount: (count: number) => void;
  setVitals: (vitals: {
    hull: number;
    hullMax: number;
    shield: number;
    shieldMax: number;
    energy: number;
  }) => void;
  setAfterburnerActive: (active: boolean) => void;
}

export const useHudStore = create<HudState>((set) => ({
  planetId: 'vega_kalabesh',
  connectionStatus: 'offline',
  connectionError: null,
  sessionId: null,
  playerCount: 0,
  hull: 100,
  hullMax: 100,
  shield: 50,
  shieldMax: 50,
  energy: 100,
  energyMax: 100,
  cryonite: 0,
  afterburnerActive: false,
  setConnection: (connectionStatus, sessionId = null, connectionError = null) =>
    set({ connectionStatus, sessionId, connectionError }),
  setPlayerCount: (playerCount) => set({ playerCount }),
  setVitals: (vitals) => set(vitals),
  setAfterburnerActive: (afterburnerActive) => set({ afterburnerActive })
}));
