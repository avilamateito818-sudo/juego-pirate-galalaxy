import 'dotenv/config';
import { HANGAR_SHIPS, MISSION_LIST } from '@starcorsair/shared';
import { hashPassword } from '../src/services/authService.js';
import { prisma } from '../src/services/prisma.js';

async function main(): Promise<void> {
  const email = 'vega@starcorsair.gg';
  const starterShip = HANGAR_SHIPS.vega_scout;

  const pilot = await prisma.pilot.upsert({
    where: { email },
    update: {},
    create: {
      callsign: 'CommanderVega',
      email,
      passwordHash: hashPassword('Vega2026!'),
      cryonite: 150,
      blueprints: 1,
      kills: 0,
      activePlanet: 'vega_kalabesh',
      activeShipModelId: starterShip.id,
      ships: {
        create: {
          shipModelId: starterShip.id,
          isActive: true,
          hullMax: starterShip.hullMax,
          shieldMax: starterShip.shieldMax
        }
      },
      missions: {
        create: MISSION_LIST.map((m) => ({
          missionId: m.id,
          progress: 0,
          targetCount: m.targetCount,
          completed: false,
          claimed: false
        }))
      }
    }
  });

  console.log(`[Seed] Piloto demo listo: ${pilot.callsign} (${pilot.email})`);
}

main()
  .catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
