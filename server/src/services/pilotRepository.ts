import crypto from 'node:crypto';
import {
  DEFAULT_LOADOUT,
  HANGAR_SHIPS,
  MISSIONS,
  TECH_MODULES,
  canCraftOrEquipTech,
  createInitialMissions,
  createInitialTechProgress,
  sanitizeLoadout,
  type AuthPilotProfile,
  type BlueprintProgress,
  type EquippedLoadout,
  type MissionId,
  type MissionProgressState,
  type PlanetId,
  type ShipModelId,
  type TechModuleId
} from '@starcorsair/shared';
import { hashPassword, verifyPassword } from './authService.js';
import { prisma } from './prisma.js';

export type PersistenceMode = 'postgresql' | 'memory-fallback';

export interface PilotSnapshotUpdate {
  cryonite: number;
  blueprints: number;
  kills: number;
  activePlanet: PlanetId;
  activeShipModelId: ShipModelId;
  loadout: EquippedLoadout;
  techProgress: readonly BlueprintProgress[];
  missions: readonly MissionProgressState[];
}

export interface PurchaseShipResult {
  ok: boolean;
  error?: string;
  profile?: AuthPilotProfile;
}

export interface CraftTechResult {
  ok: boolean;
  action?: 'equip' | 'craft_and_equip';
  error?: string;
  profile?: AuthPilotProfile;
}

export interface ClaimMissionResult {
  ok: boolean;
  error?: string;
  profile?: AuthPilotProfile;
}

export interface PilotRepository {
  readonly mode: PersistenceMode;
  register(
    callsign: string,
    email: string,
    password: string
  ): Promise<AuthPilotProfile>;
  login(email: string, password: string): Promise<AuthPilotProfile | null>;
  createGuest(preferredCallsign?: string): Promise<AuthPilotProfile>;
  getById(pilotId: string): Promise<AuthPilotProfile | null>;
  saveProgress(pilotId: string, update: PilotSnapshotUpdate): Promise<void>;
  purchaseOrEquipShip(
    pilotId: string,
    shipModelId: ShipModelId,
    currentCryonite: number
  ): Promise<PurchaseShipResult>;
  craftOrEquipTech(
    pilotId: string,
    techId: TechModuleId,
    currentSnapshot: PilotSnapshotUpdate
  ): Promise<CraftTechResult>;
  claimMission(
    pilotId: string,
    missionId: MissionId,
    currentSnapshot: PilotSnapshotUpdate
  ): Promise<ClaimMissionResult>;
}

function isValidPlanetId(value: string): value is PlanetId {
  return value === 'vega_kalabesh' || value === 'vega_aurora';
}

function isValidShipId(value: string): value is ShipModelId {
  return value in HANGAR_SHIPS;
}

function parseLoadout(json: string): EquippedLoadout {
  if (!json) return { ...DEFAULT_LOADOUT };
  try {
    return sanitizeLoadout(JSON.parse(json));
  } catch {
    return { ...DEFAULT_LOADOUT };
  }
}

function mergeMissions(
  existing: ReadonlyArray<{
    missionId: string;
    progress: number;
    targetCount: number;
    completed: boolean;
    claimed: boolean;
  }>
): MissionProgressState[] {
  const byId = new Map(existing.map((m) => [m.missionId, m]));
  return createInitialMissions().map((base) => {
    const found = byId.get(base.missionId);
    if (!found) return base;
    return {
      missionId: base.missionId,
      progress: found.progress,
      targetCount: base.targetCount,
      completed: found.completed,
      claimed: found.claimed
    };
  });
}

function mergeTechProgress(
  existing: ReadonlyArray<{
    blueprintId: string;
    collected: number;
    required: number;
    unlocked: boolean;
    crafted: boolean;
  }>
): BlueprintProgress[] {
  const byId = new Map(existing.map((t) => [t.blueprintId, t]));
  return createInitialTechProgress().map((base) => {
    const found = byId.get(base.blueprintId);
    if (!found) return base;
    return {
      blueprintId: base.blueprintId,
      collected: Math.max(base.collected, found.collected),
      required: base.required,
      unlocked: base.unlocked || found.unlocked,
      crafted: base.crafted || found.crafted
    };
  });
}

class PrismaPilotRepository implements PilotRepository {
  public readonly mode: PersistenceMode = 'postgresql';

  public async register(
    callsign: string,
    email: string,
    password: string
  ): Promise<AuthPilotProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCallsign = callsign.trim().slice(0, 24);
    const starter = HANGAR_SHIPS.vega_scout;
    const initialMissions = createInitialMissions();
    const initialTech = createInitialTechProgress();

    const created = await prisma.pilot.create({
      data: {
        callsign: cleanCallsign,
        email: cleanEmail,
        passwordHash: hashPassword(password),
        activePlanet: 'vega_kalabesh',
        activeShipModelId: starter.id,
        loadoutJson: JSON.stringify(DEFAULT_LOADOUT),
        ships: {
          create: {
            shipModelId: starter.id,
            isActive: true,
            hullMax: starter.hullMax,
            shieldMax: starter.shieldMax
          }
        },
        blueprintUnlocks: {
          create: initialTech.map((t) => ({
            blueprintId: t.blueprintId,
            collected: t.collected,
            required: t.required,
            unlocked: t.unlocked,
            crafted: t.crafted
          }))
        },
        missions: {
          create: initialMissions.map((m) => ({
            missionId: m.missionId,
            progress: m.progress,
            targetCount: m.targetCount,
            completed: m.completed,
            claimed: m.claimed
          }))
        }
      },
      include: { ships: true, missions: true, blueprintUnlocks: true }
    });

    return this.toProfile(created);
  }

  public async login(
    email: string,
    password: string
  ): Promise<AuthPilotProfile | null> {
    const found = await prisma.pilot.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { ships: true, missions: true, blueprintUnlocks: true }
    });
    if (!found) return null;
    if (!verifyPassword(password, found.passwordHash)) return null;
    return this.toProfile(found);
  }

  public async createGuest(preferredCallsign?: string): Promise<AuthPilotProfile> {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const callsign =
      preferredCallsign && preferredCallsign.trim().length >= 3
        ? `${preferredCallsign.trim().slice(0, 16)}-${suffix.slice(0, 3)}`
        : `Corsair-${suffix}`;
    const email = `guest_${suffix.toLowerCase()}@starcorsair.local`;
    const randomPass = crypto.randomBytes(16).toString('hex');
    return this.register(callsign, email, randomPass);
  }

  public async getById(pilotId: string): Promise<AuthPilotProfile | null> {
    const found = await prisma.pilot.findUnique({
      where: { id: pilotId },
      include: { ships: true, missions: true, blueprintUnlocks: true }
    });
    return found ? this.toProfile(found) : null;
  }

  public async saveProgress(
    pilotId: string,
    update: PilotSnapshotUpdate
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.pilot.update({
        where: { id: pilotId },
        data: {
          cryonite: update.cryonite,
          blueprints: update.blueprints,
          kills: update.kills,
          activePlanet: update.activePlanet,
          activeShipModelId: update.activeShipModelId,
          loadoutJson: JSON.stringify(update.loadout)
        }
      });

      for (const m of update.missions) {
        await tx.missionProgress.upsert({
          where: {
            pilotId_missionId: { pilotId, missionId: m.missionId }
          },
          update: {
            progress: m.progress,
            completed: m.completed,
            claimed: m.claimed
          },
          create: {
            pilotId,
            missionId: m.missionId,
            progress: m.progress,
            targetCount: m.targetCount,
            completed: m.completed,
            claimed: m.claimed
          }
        });
      }

      for (const t of update.techProgress) {
        await tx.blueprintUnlock.upsert({
          where: {
            pilotId_blueprintId: { pilotId, blueprintId: t.blueprintId }
          },
          update: {
            collected: t.collected,
            unlocked: t.unlocked,
            crafted: t.crafted
          },
          create: {
            pilotId,
            blueprintId: t.blueprintId,
            collected: t.collected,
            required: t.required,
            unlocked: t.unlocked,
            crafted: t.crafted
          }
        });
      }
    });
  }

  public async purchaseOrEquipShip(
    pilotId: string,
    shipModelId: ShipModelId,
    currentCryonite: number
  ): Promise<PurchaseShipResult> {
    const spec = HANGAR_SHIPS[shipModelId];

    return prisma.$transaction(async (tx) => {
      const pilot = await tx.pilot.findUnique({
        where: { id: pilotId },
        include: { ships: true, missions: true, blueprintUnlocks: true }
      });
      if (!pilot) return { ok: false, error: 'Piloto no encontrado.' };

      const syncedCryonite = Math.max(pilot.cryonite, currentCryonite);
      const alreadyOwned = pilot.ships.some((s) => s.shipModelId === shipModelId);

      let nextCryonite = syncedCryonite;
      if (!alreadyOwned) {
        if (syncedCryonite < spec.costCryonite) {
          return {
            ok: false,
            error: `Crionita insuficiente: necesitas ${spec.costCryonite} (tienes ${syncedCryonite}).`
          };
        }
        nextCryonite = syncedCryonite - spec.costCryonite;
        await tx.ship.create({
          data: {
            pilotId,
            shipModelId,
            isActive: true,
            hullMax: spec.hullMax,
            shieldMax: spec.shieldMax
          }
        });
      }

      await tx.ship.updateMany({
        where: { pilotId },
        data: { isActive: false }
      });
      await tx.ship.update({
        where: { pilotId_shipModelId: { pilotId, shipModelId } },
        data: { isActive: true }
      });

      const updated = await tx.pilot.update({
        where: { id: pilotId },
        data: {
          cryonite: nextCryonite,
          activeShipModelId: shipModelId
        },
        include: { ships: true, missions: true, blueprintUnlocks: true }
      });

      return { ok: true, profile: this.toProfile(updated) };
    });
  }

  public async craftOrEquipTech(
    pilotId: string,
    techId: TechModuleId,
    currentSnapshot: PilotSnapshotUpdate
  ): Promise<CraftTechResult> {
    const check = canCraftOrEquipTech(
      currentSnapshot.techProgress,
      techId,
      currentSnapshot.cryonite
    );
    if (!check.ok) {
      const msg =
        check.reason === 'locked'
          ? 'Tecnología bloqueada: recoge sus planos de los enemigos Mantis.'
          : check.reason === 'cryonite'
            ? `Crionita insuficiente (necesitas ${TECH_MODULES[techId].costCryonite}).`
            : 'Tecnología inválida.';
      return { ok: false, error: msg };
    }

    const spec = TECH_MODULES[techId];
    const nextLoadout: EquippedLoadout = {
      ...currentSnapshot.loadout,
      [spec.slot]: techId
    };
    const nextCryonite = currentSnapshot.cryonite - check.cost;

    return prisma.$transaction(async (tx) => {
      await tx.blueprintUnlock.upsert({
        where: { pilotId_blueprintId: { pilotId, blueprintId: techId } },
        update: {
          collected: spec.requiredBlueprints,
          unlocked: true,
          crafted: true
        },
        create: {
          pilotId,
          blueprintId: techId,
          collected: spec.requiredBlueprints,
          required: spec.requiredBlueprints,
          unlocked: true,
          crafted: true
        }
      });

      const updated = await tx.pilot.update({
        where: { id: pilotId },
        data: {
          cryonite: nextCryonite,
          blueprints: currentSnapshot.blueprints,
          kills: currentSnapshot.kills,
          loadoutJson: JSON.stringify(nextLoadout)
        },
        include: { ships: true, missions: true, blueprintUnlocks: true }
      });

      return { ok: true, action: check.action, profile: this.toProfile(updated) };
    });
  }

  public async claimMission(
    pilotId: string,
    missionId: MissionId,
    currentSnapshot: PilotSnapshotUpdate
  ): Promise<ClaimMissionResult> {
    const def = MISSIONS[missionId];
    const targetState = currentSnapshot.missions.find(
      (m) => m.missionId === missionId
    );
    if (!targetState || !targetState.completed || targetState.claimed) {
      return { ok: false, error: 'Misión no completada o ya reclamada.' };
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.pilot.update({
        where: { id: pilotId },
        data: {
          cryonite: currentSnapshot.cryonite + def.rewardCryonite,
          blueprints: currentSnapshot.blueprints + def.rewardBlueprints,
          kills: currentSnapshot.kills,
          activePlanet: currentSnapshot.activePlanet,
          activeShipModelId: currentSnapshot.activeShipModelId
        },
        include: { ships: true, missions: true, blueprintUnlocks: true }
      });

      await tx.missionProgress.upsert({
        where: { pilotId_missionId: { pilotId, missionId } },
        update: {
          progress: def.targetCount,
          completed: true,
          claimed: true
        },
        create: {
          pilotId,
          missionId,
          progress: def.targetCount,
          targetCount: def.targetCount,
          completed: true,
          claimed: true
        }
      });

      const refreshed = await tx.pilot.findUnique({
        where: { id: updated.id },
        include: { ships: true, missions: true, blueprintUnlocks: true }
      });
      if (!refreshed) return { ok: false, error: 'Error al recargar piloto.' };
      return { ok: true, profile: this.toProfile(refreshed) };
    });
  }

  private toProfile(record: {
    id: string;
    callsign: string;
    email: string;
    cryonite: number;
    blueprints: number;
    kills: number;
    activePlanet: string;
    activeShipModelId: string;
    loadoutJson: string;
    ships: Array<{ shipModelId: string }>;
    blueprintUnlocks: Array<{
      blueprintId: string;
      collected: number;
      required: number;
      unlocked: boolean;
      crafted: boolean;
    }>;
    missions: Array<{
      missionId: string;
      progress: number;
      targetCount: number;
      completed: boolean;
      claimed: boolean;
    }>;
  }): AuthPilotProfile {
    const owned = record.ships
      .map((s) => s.shipModelId)
      .filter((id): id is ShipModelId => isValidShipId(id));

    return {
      id: record.id,
      callsign: record.callsign,
      email: record.email,
      cryonite: record.cryonite,
      blueprints: record.blueprints,
      kills: record.kills,
      activePlanet: isValidPlanetId(record.activePlanet)
        ? record.activePlanet
        : 'vega_kalabesh',
      activeShipModelId: isValidShipId(record.activeShipModelId)
        ? record.activeShipModelId
        : 'vega_scout',
      ownedShips: owned.length > 0 ? owned : ['vega_scout'],
      loadout: parseLoadout(record.loadoutJson),
      techProgress: mergeTechProgress(record.blueprintUnlocks),
      missions: mergeMissions(record.missions)
    };
  }
}

interface MemoryPilotRecord {
  id: string;
  callsign: string;
  email: string;
  passwordHash: string;
  cryonite: number;
  blueprints: number;
  kills: number;
  activePlanet: PlanetId;
  activeShipModelId: ShipModelId;
  ownedShips: Set<ShipModelId>;
  loadout: EquippedLoadout;
  techProgress: BlueprintProgress[];
  missions: MissionProgressState[];
}

export class InMemoryPilotRepository implements PilotRepository {
  public readonly mode: PersistenceMode = 'memory-fallback';
  private readonly byId = new Map<string, MemoryPilotRecord>();
  private readonly byEmail = new Map<string, string>();
  private readonly byCallsign = new Map<string, string>();

  public async register(
    callsign: string,
    email: string,
    password: string
  ): Promise<AuthPilotProfile> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCallsign = callsign.trim().slice(0, 24);
    if (this.byEmail.has(cleanEmail)) {
      throw new Error('Ese correo ya está registrado.');
    }
    if (this.byCallsign.has(cleanCallsign.toLowerCase())) {
      throw new Error('Ese indicativo (callsign) ya está en uso.');
    }

    const id = `pilot_${crypto.randomBytes(6).toString('hex')}`;
    const record: MemoryPilotRecord = {
      id,
      callsign: cleanCallsign,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      cryonite: 0,
      blueprints: 0,
      kills: 0,
      activePlanet: 'vega_kalabesh',
      activeShipModelId: 'vega_scout',
      ownedShips: new Set<ShipModelId>(['vega_scout']),
      loadout: { ...DEFAULT_LOADOUT },
      techProgress: createInitialTechProgress(),
      missions: createInitialMissions()
    };

    this.byId.set(id, record);
    this.byEmail.set(cleanEmail, id);
    this.byCallsign.set(cleanCallsign.toLowerCase(), id);
    return this.toProfile(record);
  }

  public async login(
    email: string,
    password: string
  ): Promise<AuthPilotProfile | null> {
    const id = this.byEmail.get(email.trim().toLowerCase());
    if (!id) return null;
    const record = this.byId.get(id);
    if (!record || !verifyPassword(password, record.passwordHash)) return null;
    return this.toProfile(record);
  }

  public async createGuest(preferredCallsign?: string): Promise<AuthPilotProfile> {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const callsign =
      preferredCallsign && preferredCallsign.trim().length >= 3
        ? `${preferredCallsign.trim().slice(0, 16)}-${suffix.slice(0, 3)}`
        : `Corsair-${suffix}`;
    const email = `guest_${suffix.toLowerCase()}@starcorsair.local`;
    return this.register(callsign, email, crypto.randomBytes(12).toString('hex'));
  }

  public async getById(pilotId: string): Promise<AuthPilotProfile | null> {
    const record = this.byId.get(pilotId);
    return record ? this.toProfile(record) : null;
  }

  public async saveProgress(
    pilotId: string,
    update: PilotSnapshotUpdate
  ): Promise<void> {
    const record = this.byId.get(pilotId);
    if (!record) return;
    record.cryonite = update.cryonite;
    record.blueprints = update.blueprints;
    record.kills = update.kills;
    record.activePlanet = update.activePlanet;
    record.activeShipModelId = update.activeShipModelId;
    record.loadout = { ...update.loadout };
    record.techProgress = [...update.techProgress];
    record.missions = [...update.missions];
  }

  public async purchaseOrEquipShip(
    pilotId: string,
    shipModelId: ShipModelId,
    currentCryonite: number
  ): Promise<PurchaseShipResult> {
    const record = this.byId.get(pilotId);
    if (!record) return { ok: false, error: 'Piloto no encontrado.' };

    const spec = HANGAR_SHIPS[shipModelId];
    record.cryonite = Math.max(record.cryonite, currentCryonite);

    if (!record.ownedShips.has(shipModelId)) {
      if (record.cryonite < spec.costCryonite) {
        return {
          ok: false,
          error: `Crionita insuficiente: necesitas ${spec.costCryonite} (tienes ${record.cryonite}).`
        };
      }
      record.cryonite -= spec.costCryonite;
      record.ownedShips.add(shipModelId);
    }

    record.activeShipModelId = shipModelId;
    return { ok: true, profile: this.toProfile(record) };
  }

  public async craftOrEquipTech(
    pilotId: string,
    techId: TechModuleId,
    currentSnapshot: PilotSnapshotUpdate
  ): Promise<CraftTechResult> {
    const record = this.byId.get(pilotId);
    if (!record) return { ok: false, error: 'Piloto no encontrado.' };

    const check = canCraftOrEquipTech(
      currentSnapshot.techProgress,
      techId,
      currentSnapshot.cryonite
    );
    if (!check.ok) {
      const msg =
        check.reason === 'locked'
          ? 'Tecnología bloqueada: recoge sus planos de los enemigos Mantis.'
          : check.reason === 'cryonite'
            ? `Crionita insuficiente (necesitas ${TECH_MODULES[techId].costCryonite}).`
            : 'Tecnología inválida.';
      return { ok: false, error: msg };
    }

    const spec = TECH_MODULES[techId];
    record.cryonite = currentSnapshot.cryonite - check.cost;
    record.blueprints = currentSnapshot.blueprints;
    record.kills = currentSnapshot.kills;
    record.loadout = { ...currentSnapshot.loadout, [spec.slot]: techId };
    record.techProgress = currentSnapshot.techProgress.map((t) =>
      t.blueprintId === techId ? { ...t, unlocked: true, crafted: true } : t
    );

    return { ok: true, action: check.action, profile: this.toProfile(record) };
  }

  public async claimMission(
    pilotId: string,
    missionId: MissionId,
    currentSnapshot: PilotSnapshotUpdate
  ): Promise<ClaimMissionResult> {
    const record = this.byId.get(pilotId);
    if (!record) return { ok: false, error: 'Piloto no encontrado.' };

    const def = MISSIONS[missionId];
    const idx = currentSnapshot.missions.findIndex((m) => m.missionId === missionId);
    const current = idx >= 0 ? currentSnapshot.missions[idx] : undefined;
    if (!current || !current.completed || current.claimed) {
      return { ok: false, error: 'Misión no completada o ya reclamada.' };
    }

    const updatedMissions = currentSnapshot.missions.map((m) =>
      m.missionId === missionId ? { ...m, claimed: true } : m
    );
    record.cryonite = currentSnapshot.cryonite + def.rewardCryonite;
    record.blueprints = currentSnapshot.blueprints + def.rewardBlueprints;
    record.kills = currentSnapshot.kills;
    record.activePlanet = currentSnapshot.activePlanet;
    record.activeShipModelId = currentSnapshot.activeShipModelId;
    record.loadout = { ...currentSnapshot.loadout };
    record.techProgress = [...currentSnapshot.techProgress];
    record.missions = updatedMissions;

    return { ok: true, profile: this.toProfile(record) };
  }

  private toProfile(r: MemoryPilotRecord): AuthPilotProfile {
    return {
      id: r.id,
      callsign: r.callsign,
      email: r.email,
      cryonite: r.cryonite,
      blueprints: r.blueprints,
      kills: r.kills,
      activePlanet: r.activePlanet,
      activeShipModelId: r.activeShipModelId,
      ownedShips: Array.from(r.ownedShips),
      loadout: { ...r.loadout },
      techProgress: [...r.techProgress],
      missions: [...r.missions]
    };
  }
}

let activeRepo: PilotRepository = new InMemoryPilotRepository();

export async function initPilotRepository(): Promise<PilotRepository> {
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      activeRepo = new PrismaPilotRepository();
      console.log('[StarCorsair DB] Connected to PostgreSQL via Prisma ORM.');
      return activeRepo;
    } catch {
      console.warn(
        '[StarCorsair DB] PostgreSQL unreachable — running in dev memory-fallback mode. Start DB with: npm run db:up'
      );
    }
  }
  activeRepo = new InMemoryPilotRepository();
  return activeRepo;
}

export function getPilotRepository(): PilotRepository {
  return activeRepo;
}
