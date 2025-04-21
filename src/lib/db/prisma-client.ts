import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Ensure the Prisma client is not recreated on hot reloads in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;