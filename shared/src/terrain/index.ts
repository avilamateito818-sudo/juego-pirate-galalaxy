import type { PlanetId } from '../types/index.js';

/**
 * Función pura y determinista de altura del terreno planetario (ARCHITECTURE.md Regla 7).
 * Tanto Three.js (/client) como Colyseus (/server) usan exactamente esta ecuación.
 */
export function getTerrainHeight(planetId: PlanetId, x: number, z: number): number {
  const distSq = x * x + z * z;
  const landingBlend = Math.min(1, Math.max(0, (Math.sqrt(distSq) - 18) / 22));

  switch (planetId) {
    case 'vega_kalabesh': {
      const rollingHills =
        Math.sin(x * 0.025) * Math.cos(z * 0.025) * 6.5 +
        Math.sin((x + z) * 0.012) * 4.0 +
        Math.cos(x * 0.06 - z * 0.05) * 1.4;
      return rollingHills * landingBlend;
    }

    case 'vega_aurora': {
      // Relieve volcánico con crestas pronunciadas y cañones profundos
      const ridges =
        Math.abs(Math.sin(x * 0.028 + z * 0.015)) * 10.5 +
        Math.cos(z * 0.032 - x * 0.018) * 5.2 +
        Math.sin(x * 0.07) * Math.sin(z * 0.07) * 2.2 -
        4.5;
      return ridges * landingBlend;
    }
  }
}
