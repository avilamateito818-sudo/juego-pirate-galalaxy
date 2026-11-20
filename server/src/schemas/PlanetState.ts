import { MapSchema, Schema, type } from '@colyseus/schema';
import type { PlanetId } from '@starcorsair/shared';

/**
 * Capa Adapter @colyseus/schema (ARCHITECTURE.md Regla 8).
 * Mantiene /shared libre de decoradores de Colyseus.
 */
export class ShipSchema extends Schema {
  @type('string') id = '';
  @type('string') callsign = '';
  @type('number') x = 0;
  @type('number') y = 0;
  @type('number') z = 0;
  @type('number') yaw = 0;
  @type('number') hull = 100;
  @type('number') hullMax = 100;
  @type('number') shield = 50;
  @type('number') shieldMax = 50;
  @type('number') energy = 100;
  @type('number') lastProcessedSeq = 0;
}

export class PlanetRoomState extends Schema {
  @type('string') planetId: PlanetId = 'vega_kalabesh';
  @type({ map: ShipSchema }) ships = new MapSchema<ShipSchema>();
}
