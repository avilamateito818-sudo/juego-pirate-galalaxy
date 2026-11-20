import { MISSIONS } from '@starcorsair/shared';
import { planetClient } from '../network/planetClient';
import { useHudStore } from '../store/useHudStore';

export function MissionTracker() {
  const missions = useHudStore((s) => s.missions);

  const visibleMissions = missions.filter((m) => !m.claimed).slice(0, 3);
  if (visibleMissions.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-500/35 bg-slate-950/80 px-3 py-2 text-[11px] text-emerald-300 backdrop-blur-md">
        ✅ Todas las misiones del Sistema Vega completadas.
      </div>
    );
  }

  return (
    <div className="pointer-events-auto w-72 rounded-xl border border-slate-700/60 bg-slate-950/80 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-cyan-400">
        <span>📋 Misiones Activas</span>
        <span className="text-slate-500">
          {missions.filter((m) => m.claimed).length}/{missions.length}
        </span>
      </div>

      <div className="space-y-2">
        {visibleMissions.map((m) => {
          const def = MISSIONS[m.missionId];
          if (!def) return null;
          const pct = Math.min(100, Math.round((m.progress / m.targetCount) * 100));

          return (
            <div
              key={m.missionId}
              className={`rounded-lg border p-2 text-xs ${
                m.completed
                  ? 'border-amber-400/60 bg-amber-950/30'
                  : 'border-slate-800 bg-slate-900/65'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-100">{def.title}</span>
                <span className="text-[11px] font-bold text-cyan-300">
                  {m.progress}/{m.targetCount}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                {def.description}
              </p>

              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    m.completed ? 'bg-amber-400' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {m.completed && (
                <button
                  type="button"
                  onClick={() => planetClient.claimMission(m.missionId)}
                  className="mt-2 w-full rounded-md bg-amber-500 py-1 text-[11px] font-bold text-slate-950 transition hover:bg-amber-400"
                >
                  Reclamar +{def.rewardCryonite} Crionita
                  {def.rewardBlueprints > 0 ? ` +${def.rewardBlueprints} Plano` : ''}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
