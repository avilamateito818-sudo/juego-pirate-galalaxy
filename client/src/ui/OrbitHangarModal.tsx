import { HANGAR_SHIPS, type ShipModelId } from '@starcorsair/shared';
import { planetClient } from '../network/planetClient';
import { useHudStore } from '../store/useHudStore';

const SHIP_LIST: ShipModelId[] = ['vega_scout', 'vega_storm', 'vega_tank'];

export function OrbitHangarModal() {
  const inOrbit = useHudStore((s) => s.inOrbit);
  const shipModelId = useHudStore((s) => s.shipModelId);
  const cryonite = useHudStore((s) => s.cryonite);
  const blueprints = useHudStore((s) => s.blueprints);
  const kills = useHudStore((s) => s.kills);

  if (!inOrbit) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-6 shadow-2xl shadow-cyan-950/60">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-cyan-400">
              Órbita de Kalabesh • Hangar Orbital
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Estación de Flota Vega
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 text-amber-300">
              Crionita: <span className="font-bold">{cryonite}</span>
            </div>
            <div className="rounded-lg border border-purple-500/30 bg-purple-950/30 px-3 py-1.5 text-purple-300">
              Planos: <span className="font-bold">{blueprints}</span>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-300">
              Bajas Mantis: <span className="font-bold">{kills}</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          En órbita tu casco, escudo y energía se recargan al 100%. Usa la crionita
          recolectada en la superficie para mejorar tu nave (validado autoritativamente
          por el servidor).
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {SHIP_LIST.map((id) => {
            const spec = HANGAR_SHIPS[id];
            const isEquipped = shipModelId === id;
            const canAfford = cryonite >= spec.costCryonite;

            return (
              <div
                key={id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                  isEquipped
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-900/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: spec.color }}
                    />
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">
                      {spec.role}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-slate-100">
                    {spec.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">{spec.description}</p>

                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Casco máx:</span>
                      <span className="font-semibold text-emerald-400">
                        {spec.hullMax}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Escudo máx:</span>
                      <span className="font-semibold text-sky-400">
                        {spec.shieldMax}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Potencia armas:</span>
                      <span className="font-semibold text-orange-300">
                        {Math.round(spec.damageMultiplier * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Velocidad:</span>
                      <span className="font-semibold text-cyan-300">
                        {spec.movement.baseSpeed} u/s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {isEquipped ? (
                    <div className="w-full rounded-lg border border-cyan-500/40 bg-cyan-500/15 py-2 text-center text-xs font-bold text-cyan-300">
                      Equipada
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => planetClient.buyOrEquipShip(id)}
                      disabled={!canAfford && spec.costCryonite > 0}
                      className={`w-full rounded-lg py-2 text-xs font-bold transition ${
                        canAfford || spec.costCryonite === 0
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'cursor-not-allowed bg-slate-800 text-slate-500'
                      }`}
                    >
                      {spec.costCryonite === 0
                        ? 'Equipar (Gratis)'
                        : `Comprar / Equipar (${spec.costCryonite} Crionita)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => planetClient.castAbility(8)}
            className="rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          >
            Descender a Superficie de Kalabesh [8]
          </button>
        </div>
      </div>
    </div>
  );
}
