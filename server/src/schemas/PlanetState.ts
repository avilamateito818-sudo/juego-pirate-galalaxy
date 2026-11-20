import { MapSchema, Schema, type } from '@colyseus/schema';
import type {
  EnemyAiState,
  EnemyArchetypeId,
  LootKind,
  PlanetId,
  ShipModelId
} from '@starcorsair/shared';

/**
 * Capa Adapter @colyseus/schema (ARCHITECTURE.md Regla 8).
 * Mantiene /shared libre de decoradores de Colyseus.
 */
export class ShipSchema extends Schema {
  @type('string') id = '';
  @type('string') callsign = '';
  @type('string') shipModelId: ShipModelId = 'vega_scout';
  @type('number') x = 0;
  @type('number') y = 0;
  @type('number') z = 0;
  @type('number') yaw = 0;
  @type('number') hull = 110;
  @type('number') hullMax = 110;
  @type('number') shield = 60;
  @type('number') shieldMax = 60;
  @type('number') energy = 100;
  @type('number') cryonite = 0;
  @type('number') blueprints = 0;
  @type('number') kills = 0;
  @type('string') targetId = '';
  @type('boolean') alive = true;
  @type('boolean') inOrbit = false;
  @type('boolean') afterburner = false;
  @type('number') lastProcessedSeq = 0;
  // Cooldowns autoritativos restantes en ms (0 = listo)
  @type('number') cd1 = 0;
  @type('number') cd2 = 0;
  @type('number') cd3 = 0;
  @type('number') cd5 = 0;
  @type('number') cd6 = 0;
  @type('number') cd7 = 0;
  @type('number') cd8 = 0;
}

export class EnemySchema extends Schema {
  @type('string') id = '';
  @type('string') archetypeId: EnemyArchetypeId = 'mantis_scout';
  @type('string') name = '';
  @type('number') level = 1;
  @type('number') x = 0;
  @type('number') y = 0;
  @type('number') z = 0;
  @type('number') yaw = 0;
  @type('number') hull = 65;
  @type('number') hullMax = 65;
  @type('number') shield = 20;
  @type('number') shieldMax = 20;
  @type('boolean') alive = true;
  @type('string') aiState: EnemyAiState = 'patrol';
}

export class LootDropSchema extends Schema {
  @type('string') id = '';
  @type('string') kind: LootKind = 'cryonite';
  @type('number') amount = 0;
  @type('string') label = '';
  @type('number') x = 0;
  @type('number') y = 0;
  @type('number') z = 0;
}

export class PlanetRoomState extends Schema {
  @type('string') planetId: PlanetId = 'vega_kalabesh';
  @type({ map: ShipSchema }) ships = new MapSchema<ShipSchema>();
  @type({ map: EnemySchema }) enemies = new MapSchema<EnemySchema>();
  @type({ map: LootDropSchema }) drops = new MapSchema<LootDropSchema>();
}
