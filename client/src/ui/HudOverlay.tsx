import {
  HANGAR_SHIPS,
  PLANETS,
  resolveEffectiveAbility,
  type AbilitySlot
} from '@starcorsair/shared';
import { soundEngine } from '../audio/soundEngine';
import { clearStoredToken } from '../network/authApi';
import { planetClient } from '../network/planetClient';
import { useHudStore, type CooldownsState } from '../store/useHudStore';
import { MinimapRadar } from './MinimapRadar';
import { MissionTracker } from './MissionTracker';
import { OrbitHangarModal } from './OrbitHangarModal';

const SLOTS: AbilitySlot[] = [1, 2, 3, 4, 5, 6, 7, 8];

function getSlotCooldown(slot: AbilitySlot, cds: CooldownsState): number {
  switch (slot) {
    case 1:
      return cds.cd1;
    case 2:
      return cds.cd2;
    case 3:
      return cds.cd3;
    case 4:
      return 0;
    case 5:
      return cds.cd5;
    case 6:
      return cds.cd6;
    case 7:
      return cds.cd7;
    case 8:
      return cds.cd8;
  }
}

export function HudOverlay() {
  const authToken = useHudStore((s) => s.authToken);
  const callsign = useHudStore((s) => s.callsign);
  const persistenceMode = useHudStore((s) => s.persistenceMode);
  const planetId = useHudStore((s) => s.planetId);
  const connectionStatus = useHudStore((s) => s.connectionStatus);
  const connectionError = useHudStore((s) => s.connectionError);
  const playerCount = useHudStore((s) => s.playerCount);
  const shipModelId = useHudStore((s) => s.shipModelId);
  const loadout = useHudStore((s) => s.loadout);
  const hull = useHudStore((s) => s.hull);
  const hullMax = useHudStore((s) => s.hullMax);
  const shield = useHudStore((s) => s.shield);
  const shieldMax = useHudStore((s) => s.shieldMax);
  const energy = useHudStore((s) => s.energy);
  const energyMax = useHudStore((s) => s.energyMax);
  const cryonite = useHudStore((s) => s.cryonite);
  const blueprints = useHudStore((s) => s.blueprints);
  const kills = useHudStore((s) => s.kills);
  const alive = useHudStore((s) => s.alive);
  const inOrbit = useHudStore((s) => s.inOrbit);
  const afterburnerActive = useHudStore((s) => s.afterburnerActive);
  const target = useHudStore((s) => s.target);
  const cooldowns = useHudStore((s) => s.cooldowns);
  const combatLog = useHudStore((s) => s.combatLog);
  const muted = useHudStore((s) => s.muted);

  const shipSpec = HANGAR_SHIPS[shipModelId];
  const planet = PLANETS[planetId];
  const activeBlaster = resolveEffectiveAbility(1, loadout);
  const targetInRange = target ? target.distance <= activeBlaster.range : false;

  const statusColor =
    connectionStatus === 'connected'
      ? 'text-emerald-400'
      : connectionStatus === 'connecting'
        ? 'text-amber-300'
        : 'text-rose-400';

  const handleToggleMute = () => {
    soundEngine.muted = !muted;
    useHudStore.getState().toggleMuted();
  };

  const handleLogout = () => {
    planetClient.disconnect();
    clearStoredToken();
    useHudStore.getState().clearAuthSession();
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-4">
        <header className="grid grid-cols-3 items-start gap-4">
          <div className="flex flex-col items-start gap-2">
            <div className="rounded-lg border border-cyan-500/30 bg-slate-950/80 px-4 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-cyan-400">
                <span>{callsign || 'Piloto'}</span>
                <span className="text-slate-600">•</span>
                <span>{shipSpec.name}</span>
              </div>
              <div className="text-sm font-semibold text-slate-100">
                {planet.name} ({planet.systemName})
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                <span className="text-slate-200">WASD</span> volar •{' '}
                <span className="text-slate-200">Shift</span> boost •{' '}
                <span className="text-slate-200">Clic/Tab</span> objetivo •{' '}
                <span className="text-slate-200">1-8</span> sistemas
              </div>
            </div>

            <div className="pointer-events-auto flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleToggleMute}
                className="rounded-md border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-400"
              >
                {muted ? '🔇 Audio Off' : '🔊 Audio On'}
              </button>
              <button
                type="button"
                onClick={() => planetClient.cycleNearestTarget()}
                className="rounded-md border border-rose-500/40 bg-rose-950/50 px-2.5 py-1 text-[11px] text-rose-200 hover:border-rose-400"
              >
                🎯 Fijar Mantis [Tab]
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-[11px] text-slate-400 hover:border-rose-400 hover:text-rose-300"
              >
                Salir
              </button>
            </div>

            <MissionTracker />
          </div>

          <div className="flex flex-col items-center">
            {!alive && (
              <div className="rounded-xl border border-rose-500/60 bg-rose-950/90 px-5 py-2.5 text-center backdrop-blur-md">
                <div className="text-sm font-bold text-rose-300">NAVE DESTRUIDA</div>
                <div className="text-xs text-rose-200">
                  Reconstruyendo en zona segura de aterrizaje...
                </div>
              </div>
            )}

            {alive && target && (
              <div className="w-full max-w-xs rounded-xl border border-rose-500/45 bg-slate-950/85 px-4 py-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-300">
                    {target.name}{' '}
                    <span className="text-slate-400">Nv.{target.level}</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      targetInRange
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {target.distance}m {targetInRange ? 'EN RANGO' : 'LEJOS'}
                  </span>
                </div>

                {target.shieldMax > 0 && (
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-slate-800">
                    <div
                      className="h-full bg-sky-400 transition-all duration-100"
                      style={{
                        width: `${Math.max(0, (target.shield / target.shieldMax) * 100)}%`
                      }}
                    />
                  </div>
                )}

                <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full bg-rose-500 transition-all duration-100"
                    style={{
                      width: `${Math.max(0, (target.hull / target.hullMax) * 100)}%`
                    }}
                  />
                </div>

                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                  <span>
                    Escudo: {target.shield}/{target.shieldMax}
                  </span>
                  <span>
                    Casco: {target.hull}/{target.hullMax}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2.5 rounded-lg border border-slate-700/60 bg-slate-950/80 px-3.5 py-2 text-xs backdrop-blur-md">
              <span className="font-semibold text-amber-400">💎 {cryonite}</span>
              <span className="text-slate-600">|</span>
              <span className="font-semibold text-purple-300">📘 {blueprints}</span>
              <span className="text-slate-600">|</span>
              <span className="text-rose-300">☠ {kills}</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300">Pilotos: {playerCount}</span>
              <span className="text-slate-600">|</span>
              <span className={`font-semibold uppercase tracking-wider ${statusColor}`}>
                {connectionStatus}
              </span>
            </div>

            <div className="text-[10px] text-slate-500">
              DB:{' '}
              <span
                className={
                  persistenceMode === 'postgresql'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }
              >
                {persistenceMode === 'postgresql' ? 'PostgreSQL' : 'Dev Memoria'}
              </span>
            </div>

            {connectionError && authToken && (
              <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-950/85 px-3 py-1.5 text-xs text-rose-200">
                <span>Sin conexión al servidor (:49267)</span>
                <button
                  type="button"
                  onClick={() => void planetClient.connect(planetId, authToken)}
                  className="rounded bg-rose-600 px-2 py-0.5 font-semibold text-white hover:bg-rose-500"
                >
                  Reintentar
                </button>
              </div>
            )}

            <MinimapRadar />
          </div>
        </header>

        <footer className="relative flex flex-col items-center gap-2.5">
          <div className="pointer-events-none absolute bottom-0 left-0 hidden w-80 flex-col gap-1 lg:flex">
            {combatLog.map((entry) => {
              const toneClass =
                entry.tone === 'crit'
                  ? 'border-orange-500/40 text-orange-300'
                  : entry.tone === 'loot'
                    ? 'border-amber-500/40 text-amber-200'
                    : entry.tone === 'warn'
                      ? 'border-rose-500/40 text-rose-300'
                      : 'border-slate-700/60 text-slate-300';
              return (
                <div
                  key={entry.id}
                  className={`rounded-md border bg-slate-950/75 px-2.5 py-1 text-[11px] backdrop-blur-sm ${toneClass}`}
                >
                  {entry.text}
                </div>
              );
            })}
          </div>

          <div className="grid w-full max-w-md grid-cols-3 gap-2 rounded-lg border border-slate-700/60 bg-slate-950/85 p-2 text-xs backdrop-blur-md">
            <div>
              <div className="flex justify-between text-emerald-400">
                <span>Casco</span>
                <span>
                  {hull}/{hullMax}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, (hull / hullMax) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sky-400">
                <span>Escudo</span>
                <span>
                  {shield}/{shieldMax}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full bg-sky-500 transition-all duration-150"
                  style={{ width: `${Math.max(0, (shield / shieldMax) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-amber-300">
                <span>Energía</span>
                <span>
                  {energy}/{energyMax}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full bg-amber-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, (energy / energyMax) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex flex-wrap justify-center gap-2 rounded-xl border border-cyan-500/35 bg-slate-950/90 p-2 backdrop-blur-md">
            {SLOTS.map((slotNum) => {
              const ability = resolveEffectiveAbility(slotNum, loadout);
              const cdMs = getSlotCooldown(slotNum, cooldowns);
              const onCooldown = cdMs > 0;
              const lowEnergy = energy < ability.energyCost;
              const isBoostActive = slotNum === 4 && afterburnerActive;
              const isOrbitActive = slotNum === 8 && inOrbit;

              return (
                <button
                  key={slotNum}
                  type="button"
                  title={`${ability.name}${ability.energyCost > 0 ? ` (${ability.energyCost} Energía)` : ''}`}
                  onClick={() => {
                    if (slotNum !== 4) {
                      planetClient.castAbility(slotNum);
                    }
                  }}
                  className={`relative flex h-14 w-16 flex-col items-center justify-center overflow-hidden rounded-lg border text-slate-200 transition ${
                    isBoostActive
                      ? 'border-orange-400 bg-orange-500/25 text-orange-200'
                      : isOrbitActive
                        ? 'border-cyan-400 bg-cyan-500/25 text-cyan-200'
                        : onCooldown || lowEnergy
                          ? 'border-slate-800 bg-slate-900/70 text-slate-500'
                          : 'border-slate-700 bg-slate-900/95 hover:border-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-cyan-400">
                    {slotNum}
                    {ability.tier > 1 ? (
                      <span
                        className="ml-0.5 text-[8px]"
                        style={{ color: ability.beamColor }}
                      >
                        ★{ability.tier}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[10px] font-medium leading-tight">
                    {ability.shortLabel}
                  </span>
                  {ability.energyCost > 0 && (
                    <span className="text-[9px] text-amber-400/90">
                      ⚡{ability.energyCost}
                    </span>
                  )}

                  {onCooldown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 text-xs font-bold text-cyan-300">
                      {(cdMs / 1000).toFixed(1)}s
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </footer>
      </div>

      <OrbitHangarModal />
    </>
  );
}
