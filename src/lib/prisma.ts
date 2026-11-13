import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '';
  const tursoUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
  const rawToken = process.env.TURSO_AUTH_TOKEN || '';
  const tursoAuthToken = rawToken.trim().replace(/^["']|["']$/g, '');

  // When deployed with Turso (libsql:// or https://)
  if (tursoUrl && (tursoUrl.startsWith('libsql:') || tursoUrl.startsWith('https:') || tursoUrl.startsWith('wss:'))) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  // Local development fallback: SQLite (file:./dev.db)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


