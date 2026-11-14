import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function cleanToken(token?: string): string | undefined {
  if (!token) return undefined;
  return token
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim() || undefined;
}

function cleanUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/^["']|["']$/g, '').trim();
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = cleanUrl(process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL);
  const tursoAuthToken = cleanToken(process.env.TURSO_AUTH_TOKEN);

  // When deployed with Turso (libsql:// or https:// or wss://)
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


