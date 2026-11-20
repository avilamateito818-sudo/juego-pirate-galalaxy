import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  ENEMY_ARCHETYPES,
  HANGAR_SHIPS,
  PLANETS,
  SIMULATION_CONSTANTS
} from '@starcorsair/shared';
import {
  EnemySchema,
  LootDropSchema,
  PlanetRoomState,
  ShipSchema
} from '../schemas/PlanetState.js';

describe('@starcorsair/server — Adapter Schemas & Shared Parity', () => {
  it('inicializa PlanetRoomState con naves, enemigos IA y drops alineados a @starcorsair/shared', () => {
    const state = new PlanetRoomState();
    expect(state.planetId).toBe(PLANETS.vega_kalabesh.id);
    expect(SIMULATION_CONSTANTS.TICK_RATE_HZ).toBe(20);

    const ship = new ShipSchema();
    ship.id = 'pilot-1';
    ship.shipModelId = HANGAR_SHIPS.vega_scout.id;
    ship.hullMax = HANGAR_SHIPS.vega_scout.hullMax;
    state.ships.set(ship.id, ship);

    const enemy = new EnemySchema();
    enemy.id = 'enemy-1';
    enemy.archetypeId = ENEMY_ARCHETYPES.mantis_scout.id;
    enemy.hullMax = ENEMY_ARCHETYPES.mantis_scout.hullMax;
    state.enemies.set(enemy.id, enemy);

    const drop = new LootDropSchema();
    drop.id = 'drop-1';
    drop.kind = 'cryonite';
    drop.amount = 25;
    state.drops.set(drop.id, drop);

    expect(state.ships.get('pilot-1')?.hullMax).toBe(110);
    expect(state.enemies.get('enemy-1')?.hullMax).toBe(65);
    expect(state.drops.get('drop-1')?.amount).toBe(25);
    expect(ABILITIES[1].id).toBe('blaster');
  });
});
