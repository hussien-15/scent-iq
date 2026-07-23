import { PrismaClient } from '@prisma/client';
import { assertServerEnvironment } from '@/lib/environment';

if (process.env.NODE_ENV !== 'test') assertServerEnvironment();

// Prevents creating a new PrismaClient on every hot-reload in dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
