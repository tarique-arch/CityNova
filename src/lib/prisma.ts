import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function cleanToken(token?: string): string | undefined {
  if (!token) return undefined;
  let t = String(token).trim();
  // Strip surrounding quotes (double, single, backticks)
  t = t.replace(/^["'`]+|["'`]+$/g, '').trim();
  // Strip variable name if accidentally pasted with key (e.g. TURSO_AUTH_TOKEN=... or authToken=...)
  t = t.replace(/^(?:TURSO_AUTH_TOKEN|DATABASE_AUTH_TOKEN|TURSO_TOKEN|LIBSQL_AUTH_TOKEN|authToken|token)\s*[:=]\s*/i, '').trim();
  // Strip surrounding quotes again
  t = t.replace(/^["'`]+|["'`]+$/g, '').trim();
  // Strip Bearer prefix
  t = t.replace(/^Bearer\s+/i, '').trim();
  // Strip surrounding quotes once more
  t = t.replace(/^["'`]+|["'`]+$/g, '').trim();
  // Strip trailing punctuation like semicolons, commas
  t = t.replace(/[;,]+$/, '').trim();
  return t || undefined;
}

function cleanUrl(raw?: string): { url: string; tokenFromUrl?: string } {
  if (!raw) return { url: '' };
  let url = String(raw).trim().replace(/^["'`]+|["'`]+$/g, '').trim();
  let tokenFromUrl: string | undefined;
  try {
    const fakeHttps = url.replace(/^(libsql|wss):/i, 'https:');
    const u = new URL(fakeHttps);
    const qToken = u.searchParams.get('authToken') || u.searchParams.get('jwt');
    if (qToken) tokenFromUrl = qToken;
    u.searchParams.delete('authToken');
    u.searchParams.delete('jwt');
    const protocol = url.split('://')[0];
    const path = (u.pathname === '/' || !u.pathname) ? '' : u.pathname;
    const clean = protocol + '://' + u.host + path + (u.search && u.search !== '?' ? u.search : '');
    return { url: clean, tokenFromUrl: cleanToken(tokenFromUrl) };
  } catch {
    return { url };
  }
}

export function getTursoConfig(): { url: string; authToken?: string; isTurso: boolean } {
  const rawUrl =
    process.env.TURSO_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.TURSO_URL ||
    process.env.LIBSQL_URL ||
    '';

  const { url, tokenFromUrl } = cleanUrl(rawUrl);

  const rawToken =
    process.env.TURSO_AUTH_TOKEN ||
    process.env.DATABASE_AUTH_TOKEN ||
    process.env.TURSO_TOKEN ||
    process.env.LIBSQL_AUTH_TOKEN ||
    process.env.LIBSQL_TOKEN ||
    tokenFromUrl;

  const authToken = cleanToken(rawToken);
  const isTurso = Boolean(url && (url.startsWith('libsql:') || url.startsWith('https:') || url.startsWith('wss:')));

  return { url, authToken, isTurso };
}

function createPrismaClient(): PrismaClient {
  const { url, authToken, isTurso } = getTursoConfig();

  // When deployed with Turso (libsql:// or https:// or wss://)
  if (isTurso) {
    const adapter = new PrismaLibSQL({
      url,
      authToken,
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
