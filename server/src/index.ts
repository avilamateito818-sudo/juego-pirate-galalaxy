import 'dotenv/config';
import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { SIMULATION_CONSTANTS } from '@starcorsair/shared';
import { PlanetRoom } from './rooms/PlanetRoom.js';
import { prisma } from './services/prisma.js';

const PORT = Number(process.env.SERVER_PORT ?? 2567);
const ALLOWED_ORIGINS = [
  process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'starcorsair-server',
    tickRateHz: SIMULATION_CONSTANTS.TICK_RATE_HZ
  });
});

const httpServer = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer })
});

gameServer.define('planet', PlanetRoom);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[StarCorsair Server] Listening on http://127.0.0.1:${PORT} (and http://localhost:${PORT})`);
});

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
