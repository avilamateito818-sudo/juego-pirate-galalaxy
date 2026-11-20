import { describe, expect, it } from 'vitest';
import { PLANETS, SIMULATION_CONSTANTS, STARTER_SHIP_MOVEMENT } from '@starcorsair/shared';
import { PlanetRoomState, ShipSchema } from '../schemas/PlanetState.js';

describe('@starcorsair/server — Adapter Schema & Shared Parity', () => {
  it('inicializa PlanetRoomState usando las constantes de @starcorsair/shared', () => {
    const state = new PlanetRoomState();
    expect(state.planetId).toBe(PLANETS.vega_kalabesh.id);
    expect(SIMULATION_CONSTANTS.TICK_RATE_HZ).toBe(20);

    const ship = new ShipSchema();
    ship.id = 'test-session';
    ship.y = STARTER_SHIP_MOVEMENT.hoverHeight;
    state.ships.set(ship.id, ship);

    expect(state.ships.get('test-session')?.y).toBe(STARTER_SHIP_MOVEMENT.hoverHeight);
  });
});
