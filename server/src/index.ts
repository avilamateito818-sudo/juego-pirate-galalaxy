import 'dotenv/config';
import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { SIMULATION_CONSTANTS, type AuthResponse } from '@starcorsair/shared';
import { PlanetRoom } from './rooms/PlanetRoom.js';
import { signPilotJwt, verifyPilotJwt } from './services/authService.js';
import {
  getPilotRepository,
  initPilotRepository
} from './services/pilotRepository.js';
import { prisma } from './services/prisma.js';
import { sessionRegistry } from './services/sessionRegistry.js';

const PORT = Number(process.env.SERVER_PORT ?? 49267);
const ALLOWED_ORIGINS = [
  process.env.CORS_ORIGIN ?? 'http://127.0.0.1:49173',
  'http://localhost:49173',
  'http://127.0.0.1:49173',
  'http://localhost:49100',
  'http://127.0.0.1:49100'
];

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'starcorsair-server',
    tickRateHz: SIMULATION_CONSTANTS.TICK_RATE_HZ,
    persistenceMode: getPilotRepository().mode,
    activePilotSessions: sessionRegistry.getActiveCount()
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { callsign, email, password } = (req.body ?? {}) as Record<string, unknown>;
  if (
    typeof callsign !== 'string' ||
    callsign.trim().length < 3 ||
    typeof email !== 'string' ||
    !email.includes('@') ||
    typeof password !== 'string' ||
    password.length < 6
  ) {
    res.status(400).json({
      error:
        'Datos inválidos: indicativo (mín 3), correo válido y contraseña (mín 6 caracteres).'
    });
    return;
  }

  try {
    const repo = getPilotRepository();
    const pilot = await repo.register(callsign, email, password);
    const token = signPilotJwt(pilot.id, pilot.callsign);
    res.status(201).json({
      token,
      pilot,
      persistenceMode: repo.mode
    } satisfies AuthResponse);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo registrar el piloto.';
    res.status(409).json({ error: message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Correo y contraseña requeridos.' });
    return;
  }

  const repo = getPilotRepository();
  const pilot = await repo.login(email, password);
  if (!pilot) {
    res.status(401).json({ error: 'Credenciales inválidas.' });
    return;
  }

  const token = signPilotJwt(pilot.id, pilot.callsign);
  res.json({
    token,
    pilot,
    persistenceMode: repo.mode
  } satisfies AuthResponse);
});

app.post('/api/auth/guest', async (req, res) => {
  const { callsign } = (req.body ?? {}) as Record<string, unknown>;
  try {
    const repo = getPilotRepository();
    const pilot = await repo.createGuest(
      typeof callsign === 'string' ? callsign : undefined
    );
    const token = signPilotJwt(pilot.id, pilot.callsign);
    res.status(201).json({
      token,
      pilot,
      persistenceMode: repo.mode
    } satisfies AuthResponse);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo crear sesión de invitado.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = verifyPilotJwt(token);
  if (!payload) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
    return;
  }

  const repo = getPilotRepository();
  const pilot = await repo.getById(payload.sub);
  if (!pilot) {
    res.status(404).json({ error: 'Piloto no encontrado.' });
    return;
  }

  res.json({
    token,
    pilot,
    persistenceMode: repo.mode
  } satisfies AuthResponse);
});

const httpServer = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer })
});

// filterBy(['planetId']) crea salas independientes para Kalabesh y Aurora
gameServer.define('planet', PlanetRoom).filterBy(['planetId']);

async function start(): Promise<void> {
  await initPilotRepository();
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[StarCorsair Server] Listening on http://127.0.0.1:${PORT} (DB: ${getPilotRepository().mode})`
    );
  });
}

void start();

async function shutdown(signal: string): Promise<void> {
  console.log(`[StarCorsair Server] Received ${signal}, shutting down gracefully...`);
  await gameServer.gracefullyShutdown(false);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
