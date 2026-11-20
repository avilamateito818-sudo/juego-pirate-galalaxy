import { useEffect, useRef } from 'react';
import { ENERGY_CONSTANTS } from '@starcorsair/shared';
import { planetClient } from '../network/planetClient';

const RADAR_SIZE = 144;
const RADAR_RANGE = 150;

/**
 * Radar táctico planetario renderizado en Canvas 2D a ~15 Hz sin disparar re-renders de React.
 */
export function MinimapRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const half = RADAR_SIZE / 2;
    const scale = (half - 8) / RADAR_RANGE;

    const draw = () => {
      ctx.clearRect(0, 0, RADAR_SIZE, RADAR_SIZE);

      // Fondo circular radar
      ctx.save();
      ctx.beginPath();
      ctx.arc(half, half, half - 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 6, 23, 0.84)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
      ctx.stroke();
      ctx.clip();

      // Anillos concéntricos
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 1;
      for (const r of [half * 0.35, half * 0.7]) {
        ctx.beginPath();
        ctx.arc(half, half, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const px = planetClient.localTransform.x;
      const pz = planetClient.localTransform.z;

      // Zona segura de aterrizaje (origen 0,0)
      const safeX = half + (0 - px) * scale;
      const safeY = half + (0 - pz) * scale;
      ctx.beginPath();
      ctx.arc(safeX, safeY, ENERGY_CONSTANTS.SAFE_ZONE_RADIUS * scale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.stroke();

      // Drops de botín
      for (const drop of planetClient.drops.values()) {
        const dx = half + (drop.x - px) * scale;
        const dy = half + (drop.z - pz) * scale;
        ctx.fillStyle =
          drop.kind === 'cryonite'
            ? '#facc15'
            : drop.kind === 'energy'
              ? '#38bdf8'
              : '#c084fc';
        ctx.fillRect(dx - 2, dy - 2, 4, 4);
      }

      // Enemigos Mantis
      for (const enemy of planetClient.enemies.values()) {
        if (!enemy.alive) continue;
        const ex = half + (enemy.render.x - px) * scale;
        const ey = half + (enemy.render.z - pz) * scale;
        const isTarget = enemy.id === planetClient.localTargetId;
        const isBoss = enemy.archetypeId === 'mantis_harvester';

        ctx.beginPath();
        ctx.arc(ex, ey, isBoss ? 4.2 : 2.8, 0, Math.PI * 2);
        ctx.fillStyle = isBoss ? '#e879f9' : '#ef4444';
        ctx.fill();

        if (isTarget) {
          ctx.beginPath();
          ctx.arc(ex, ey, 6.5, 0, Math.PI * 2);
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Otros jugadores
      for (const remote of planetClient.remoteShips.values()) {
        if (!remote.alive || remote.inOrbit) continue;
        const rx = half + (remote.render.x - px) * scale;
        const ry = half + (remote.render.z - pz) * scale;
        ctx.beginPath();
        ctx.arc(rx, ry, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      }

      // Nave local en el centro
      ctx.beginPath();
      ctx.arc(half, half, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();

      ctx.restore();
    };

    const timer = window.setInterval(draw, 66);
    draw();
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={RADAR_SIZE}
        height={RADAR_SIZE}
        className="rounded-full shadow-lg shadow-cyan-950/50"
      />
      <div className="mt-1 flex gap-2 text-[10px] text-slate-400">
        <span className="text-rose-400">● Mantis</span>
        <span className="text-fuchsia-400">● Jefe</span>
        <span className="text-amber-300">■ Botín</span>
      </div>
    </div>
  );
}
