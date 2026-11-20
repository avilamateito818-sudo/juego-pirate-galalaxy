import { SIMULATION_CONSTANTS } from '../constants/index.js';

export interface SpatialCell {
  readonly cx: number;
  readonly cz: number;
}

/**
 * Grilla espacial 2D pura para Area of Interest (ARCHITECTURE.md Regla 11).
 */
export function getSpatialCell(
  x: number,
  z: number,
  cellSize: number = SIMULATION_CONSTANTS.AOI_CELL_SIZE
): SpatialCell {
  return {
    cx: Math.floor(x / cellSize),
    cz: Math.floor(z / cellSize)
  };
}

export function getSpatialCellKey(
  x: number,
  z: number,
  cellSize: number = SIMULATION_CONSTANTS.AOI_CELL_SIZE
): string {
  const { cx, cz } = getSpatialCell(x, z, cellSize);
  return `${cx}:${cz}`;
}
