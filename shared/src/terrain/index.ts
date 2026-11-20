import type { PlanetId } from '../types/index.js';

/**
 * Función pura y determinista de altura del terreno planetario (ARCHITECTURE.md Regla 7).
 * Tanto Three.js (/client) como Colyseus (/server) usan exactamente esta ecuación.
 */
export function getTerrainHeight(planetId: PlanetId, x: number, z: number): number {
  switch (planetId) {
    case 'vega_kalabesh': {
      // Zona de aterrizaje plana cerca del origen (radio 25) con transición suave hacia colinas
      const distSq = x * x + z * z;
      const landingBlend = Math.min(1, Math.max(0, (Math.sqrt(distSq) - 18) / 22));
      const rollingHills =
        Math.sin(x * 0.025) * Math.cos(z * 0.025) * 6.5 +
        Math.sin((x + z) * 0.012) * 4.0 +
        Math.cos(x * 0.06 - z * 0.05) * 1.4;
      return rollingHills * landingBlend;
    }
  }
}
