import { PLANETS } from '@starcorsair/shared';
import { planetClient } from '../network/planetClient';
import { useHudStore } from '../store/useHudStore';

const ABILITY_SLOTS = [
  { key: '1', label: 'Bláster' },
  { key: '2', label: 'Colector' },
  { key: '3', label: 'Reparador' },
  { key: '4', label: 'Postq.' },
  { key: '5', label: 'Escudo' },
  { key: '6', label: 'Misil' },
  { key: '7', label: 'Pulso' },
  { key: '8', label: 'Órbita' }
] as const;

export function HudOverlay() {
  const planetId = useHudStore((s) => s.planetId);
  const connectionStatus = useHudStore((s) => s.connectionStatus);
  const connectionError = useHudStore((s) => s.connectionError);
  const playerCount = useHudStore((s) => s.playerCount);
  const hull = useHudStore((s) => s.hull);
  const hullMax = useHudStore((s) => s.hullMax);
  const shield = useHudStore((s) => s.shield);
  const shieldMax = useHudStore((s) => s.shieldMax);
  const energy = useHudStore((s) => s.energy);
  const energyMax = useHudStore((s) => s.energyMax);
  const cryonite = useHudStore((s) => s.cryonite);
  const afterburnerActive = useHudStore((s) => s.afterburnerActive);

  const statusColor =
    connectionStatus === 'connected'
      ? 'text-emerald-400'
      : connectionStatus === 'connecting'
        ? 'text-amber-300'
        : 'text-rose-400';

  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-4">
      <header className="flex items-start justify-between gap-4">
        <div className="rounded-lg border border-cyan-500/30 bg-slate-950/75 px-4 py-2 backdrop-blur-md">
          <div className="text-xs uppercase tracking-widest text-cyan-400">
            StarCorsair • Sector Activo
          </div>
          <div className="text-sm font-semibold text-slate-100">
            {PLANETS[planetId].name}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Controles: <span className="text-slate-200">WASD / Flechas</span> volar •{' '}
            <span className="text-slate-200">Shift</span> postquemador
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-950/75 px-4 py-2 text-xs backdrop-blur-md">
            <span className="font-semibold text-amber-400">Crionita: {cryonite}</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-300">Pilotos: {playerCount}</span>
            <span className="text-slate-600">|</span>
            <span className={`font-semibold uppercase tracking-wider ${statusColor}`}>
              {connectionStatus}
            </span>
          </div>

          {connectionError && (
            <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-950/85 px-3 py-1.5 text-xs text-rose-200">
              <span>Sin conexión al servidor autoritativo (:2567)</span>
              <button
                type="button"
                onClick={() => void planetClient.connect(planetId)}
                className="rounded bg-rose-600 px-2 py-0.5 font-semibold text-white hover:bg-rose-500"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </header>

      <footer className="flex flex-col items-center gap-3">
        <div className="grid w-full max-w-md grid-cols-3 gap-2 rounded-lg border border-slate-700/60 bg-slate-950/80 p-2 text-xs backdrop-blur-md">
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
                style={{ width: `${(hull / hullMax) * 100}%` }}
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
                style={{ width: `${(shield / shieldMax) * 100}%` }}
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
                style={{ width: `${(energy / energyMax) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-2 rounded-xl border border-cyan-500/30 bg-slate-950/85 p-2 backdrop-blur-md">
          {ABILITY_SLOTS.map((slot) => {
            const isActive = slot.key === '4' && afterburnerActive;
            return (
              <button
                key={slot.key}
                type="button"
                className={`flex h-12 w-14 flex-col items-center justify-center rounded-lg border text-slate-200 transition ${
                  isActive
                    ? 'border-orange-400 bg-orange-500/20 text-orange-200'
                    : 'border-slate-700 bg-slate-900/90 hover:border-cyan-400 hover:text-cyan-300'
                }`}
              >
                <span className="text-[10px] font-bold text-cyan-400">{slot.key}</span>
                <span className="text-[10px] leading-tight">{slot.label}</span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
