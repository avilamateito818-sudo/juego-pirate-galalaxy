import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma singleton para operaciones transaccionales fuera del tick loop
 * (ARCHITECTURE.md Regla 5 y Regla 9).
 */
export const prisma = new PrismaClient();
