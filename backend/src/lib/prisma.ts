/**
 * Instancia singleton del cliente Prisma
 * Evita múltiples conexiones a la base de datos en desarrollo con hot-reload
 */

import { PrismaClient } from '@prisma/client';

// Declaración global para mantener la instancia en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/** Cliente Prisma reutilizable a nivel global */
const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

// En desarrollo, guardar la instancia en el objeto global para reutilización
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
