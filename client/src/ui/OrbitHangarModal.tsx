import { useState } from 'react';
import {
  HANGAR_SHIPS,
  PLANETS,
  TECH_MODULE_LIST,
  canCraftOrEquipTech,
  type PlanetId,
  type ShipModelId
} from '@starcorsair/shared';
import { planetClient } from '../network/planetClient';
import { useHudStore } from '../store/useHudStore';

const SHIP_LIST: ShipModelId[] = ['vega_scout', 'vega_storm', 'vega_tank'];
const PLANET_LIST: PlanetId[] = ['vega_kalabesh', 'vega_aurora'];

type OrbitTab = 'hangar' | 'tech' | 'starmap';

export function OrbitHangarModal() {
  const inOrbit = useHudStore((s) => s.inOrbit);
  const planetId = useHudStore((s) => s.planetId);
  const shipModelId = useHudStore((s) => s.shipModelId);
  const ownedShips = useHudStore((s) => s.ownedShips);
  const loadout = useHudStore((s) => s.loadout);
  const techProgress = useHudStore((s) => s.techProgress);
  const cryonite = useHudStore((s) => s.cryonite);
  const blueprints = useHudStore((s) => s.blueprints);
  const kills = useHudStore((s) => s.kills);

  const [tab, setTab] = useState<OrbitTab>('hangar');

  if (!inOrbit) return null;

  const currentPlanet = PLANETS[planetId];

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-6 shadow-2xl shadow-cyan-950/60">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-cyan-400">
              Órbita de {currentPlanet.name} • {currentPlanet.systemName}
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Estación Orbital, Tecnología & Mapa Estelar
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 text-amber-300">
              💎 <span className="font-bold">{cryonite}</span> Crionita
            </div>
            <div className="rounded-lg border border-purple-500/30 bg-purple-950/30 px-3 py-1.5 text-purple-300">
              📘 <span className="font-bold">{blueprints}</span> Planos
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-300">
              ☠ <span className="font-bold">{kills}</span> Bajas
            </div>
          </div>
        </div>

        {/* Pestañas Hangar / Tecnología / Mapa Estelar */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('hangar')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === 'hangar'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            🚀 Hangar de Naves (3)
          </button>
          <button
            type="button"
            onClick={() => setTab('tech')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === 'tech'
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚙️ Tecnología & Planos (1–7)
          </button>
          <button
            type="button"
            onClick={() => setTab('starmap')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              tab === 'starmap'
                ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            🪐 Mapa Estelar — Sistema Vega (2)
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {tab === 'hangar' && (
            <div className="grid gap-4 md:grid-cols-3">
              {SHIP_LIST.map((id) => {
                const spec = HANGAR_SHIPS[id];
                const isEquipped = shipModelId === id;
                const isOwned = ownedShips.includes(id) || spec.costCryonite === 0;
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
                          disabled={!isOwned && !canAfford}
                          className={`w-full rounded-lg py-2 text-xs font-bold transition ${
                            isOwned
                              ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                              : canAfford
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'cursor-not-allowed bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isOwned
                            ? 'Equipar (En Propiedad)'
                            : `Comprar (${spec.costCryonite} Crionita)`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'tech' && (
            <div className="grid gap-3 md:grid-cols-2">
              {TECH_MODULE_LIST.map((mod) => {
                const state = techProgress.find((p) => p.blueprintId === mod.id);
                const isEquipped = loadout[mod.slot] === mod.id;
                const check = canCraftOrEquipTech(techProgress, mod.id, cryonite);
                const collected = state?.collected ?? 0;
                const required = mod.requiredBlueprints;
                const unlocked = state?.unlocked ?? required === 0;
                const crafted = state?.crafted ?? mod.costCryonite === 0;

                return (
                  <div
                    key={mod.id}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                      isEquipped
                        ? 'border-emerald-400 bg-emerald-950/25'
                        : unlocked
                          ? 'border-slate-700 bg-slate-900/80'
                          : 'border-slate-800/80 bg-slate-900/45 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-bold text-cyan-300">
                          Slot [{mod.slot}] • Tier Mk-{mod.tier}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: mod.beamColor }}
                          />
                          {required === 0
                            ? 'Estándar'
                            : unlocked
                              ? 'Plano completo ✅'
                              : `Planos: ${collected}/${required}`}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-sm font-bold text-slate-100">
                        {mod.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">{mod.description}</p>
                    </div>

                    <div className="mt-3">
                      {isEquipped ? (
                        <div className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/15 py-1.5 text-center text-xs font-bold text-emerald-300">
                          Instalado en Slot [{mod.slot}]
                        </div>
                      ) : !unlocked ? (
                        <div className="w-full rounded-lg bg-slate-800/90 py-1.5 text-center text-xs text-slate-500">
                          Bloqueado — Derrota Mantis para conseguir planos ({collected}/{required})
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!check.ok}
                          onClick={() => planetClient.craftOrEquipTech(mod.id)}
                          className={`w-full rounded-lg py-1.5 text-xs font-bold transition ${
                            crafted
                              ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                              : check.ok
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'cursor-not-allowed bg-slate-800 text-slate-500'
                          }`}
                        >
                          {crafted
                            ? `Instalar en Slot [${mod.slot}]`
                            : `Fabricar e Instalar (${mod.costCryonite} Crionita)`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'starmap' && (
            <div className="grid gap-4 md:grid-cols-2">
              {PLANET_LIST.map((pid) => {
                const p = PLANETS[pid];
                const isCurrent = pid === planetId;
                return (
                  <div
                    key={pid}
                    className={`flex flex-col justify-between rounded-xl border p-5 ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-950/25'
                        : 'border-slate-800 bg-slate-900/75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className="h-4 w-4 rounded-full shadow"
                          style={{ backgroundColor: p.visual.accentColor }}
                        />
                        <span className="text-[11px] font-semibold text-slate-400">
                          {p.dangerLevel}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-slate-100">
                        {p.name}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          ({p.systemName})
                        </span>
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-5">
                      {isCurrent ? (
                        <button
                          type="button"
                          onClick={() => planetClient.castAbility(8)}
                          className="w-full rounded-lg bg-cyan-500 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                        >
                          Descender a {p.name}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => planetClient.travelToPlanet(pid)}
                          className="w-full rounded-lg bg-orange-500 py-2 text-xs font-bold text-slate-950 hover:bg-orange-400"
                        >
                          ⚡ Salto Hiperespacial a {p.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => planetClient.castAbility(8)}
            className="rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          >
            Descender a Superficie de {currentPlanet.name} [8]
          </button>
        </div>
      </div>
    </div>
  );
}
