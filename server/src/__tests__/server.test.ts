import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  ENEMY_ARCHETYPES,
  HANGAR_SHIPS,
  PLANETS,
  SIMULATION_CONSTANTS,
  addBlueprintPiece,
  advanceMissions
} from '@starcorsair/shared';
import {
  EnemySchema,
  LootDropSchema,
  PlanetRoomState,
  ShipSchema
} from '../schemas/PlanetState.js';
import {
  hashPassword,
  signPilotJwt,
  verifyPassword,
  verifyPilotJwt
} from '../services/authService.js';
import { InMemoryPilotRepository } from '../services/pilotRepository.js';
import { sessionRegistry } from '../services/sessionRegistry.js';

describe('@starcorsair/server — Auth JWT, Sesión Única, Persistencia y Tecnología', () => {
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

  it('hashea contraseñas con scrypt y firma/verifica JWT HS256 correctamente', () => {
    const hash = hashPassword('VegaSecret2026!');
    expect(verifyPassword('VegaSecret2026!', hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);

    const token = signPilotJwt('pilot_123', 'CommanderVega');
    const decoded = verifyPilotJwt(token);
    expect(decoded?.sub).toBe('pilot_123');
    expect(decoded?.callsign).toBe('CommanderVega');

    expect(verifyPilotJwt(`${token}tampered`)).toBeNull();
  });

  it('expulsa sesión anterior cuando el mismo pilotId inicia sesión en otra pestaña (Regla 10)', async () => {
    let oldEvicted = false;
    await sessionRegistry.claimSession('pilot_unique_1', {
      sessionId: 'sess-A',
      roomId: 'room-1',
      evict: async () => {
        oldEvicted = true;
      }
    });

    const evicted = await sessionRegistry.claimSession('pilot_unique_1', {
      sessionId: 'sess-B',
      roomId: 'room-1',
      evict: async () => {}
    });

    expect(evicted).toBe(true);
    expect(oldEvicted).toBe(true);
    sessionRegistry.releaseSession('pilot_unique_1', 'sess-B');
  });

  it('ejecuta compra atómica de nave, reclamación de misión y fabricación/equipamiento de tecnología', async () => {
    const repo = new InMemoryPilotRepository();
    const pilot = await repo.register('AceVega', 'ace@vega.gg', 'Secret123');

    const failBuy = await repo.purchaseOrEquipShip(pilot.id, 'vega_storm', 40);
    expect(failBuy.ok).toBe(false);

    const okBuy = await repo.purchaseOrEquipShip(pilot.id, 'vega_storm', 150);
    expect(okBuy.ok).toBe(true);
    expect(okBuy.profile?.cryonite).toBe(30);
    expect(okBuy.profile?.activeShipModelId).toBe('vega_storm');

    const updatedMissions = advanceMissions(pilot.missions, {
      kind: 'kill',
      planetId: 'vega_kalabesh',
      archetypeId: 'mantis_scout',
      amount: 3
    });

    const claimed = await repo.claimMission(pilot.id, 'mission_kalabesh_patrol', {
      cryonite: 30,
      blueprints: 0,
      kills: 3,
      activePlanet: 'vega_kalabesh',
      activeShipModelId: 'vega_storm',
      loadout: pilot.loadout,
      techProgress: pilot.techProgress,
      missions: updatedMissions
    });
    expect(claimed.ok).toBe(true);
    expect(claimed.profile?.cryonite).toBe(110);

    // Intento de fabricar blaster_mk2 sin desbloquear plano -> rechazado
    const lockedTech = await repo.craftOrEquipTech(pilot.id, 'blaster_mk2', {
      cryonite: 110,
      blueprints: 1,
      kills: 3,
      activePlanet: 'vega_kalabesh',
      activeShipModelId: 'vega_storm',
      loadout: pilot.loadout,
      techProgress: pilot.techProgress,
      missions: claimed.profile?.missions ?? []
    });
    expect(lockedTech.ok).toBe(false);

    // Desbloquea plano y fabrica + equipa blaster_mk2 (-85 Crionita -> 25 restante)
    const unlockedTechProgress = addBlueprintPiece(pilot.techProgress, 'blaster_mk2').next;
    const crafted = await repo.craftOrEquipTech(pilot.id, 'blaster_mk2', {
      cryonite: 110,
      blueprints: 1,
      kills: 3,
      activePlanet: 'vega_kalabesh',
      activeShipModelId: 'vega_storm',
      loadout: pilot.loadout,
      techProgress: unlockedTechProgress,
      missions: claimed.profile?.missions ?? []
    });
    expect(crafted.ok).toBe(true);
    expect(crafted.action).toBe('craft_and_equip');
    expect(crafted.profile?.cryonite).toBe(25);
    expect(crafted.profile?.loadout[1]).toBe('blaster_mk2');

    // Re-equipar blaster_mk1 y volver a blaster_mk2 no vuelve a cobrar crionita
    const reEquip = await repo.craftOrEquipTech(pilot.id, 'blaster_mk2', {
      cryonite: 25,
      blueprints: 1,
      kills: 3,
      activePlanet: 'vega_kalabesh',
      activeShipModelId: 'vega_storm',
      loadout: { ...pilot.loadout, 1: 'blaster_mk1' },
      techProgress: crafted.profile?.techProgress ?? [],
      missions: claimed.profile?.missions ?? []
    });
    expect(reEquip.ok).toBe(true);
    expect(reEquip.action).toBe('equip');
    expect(reEquip.profile?.cryonite).toBe(25);
  });
});
