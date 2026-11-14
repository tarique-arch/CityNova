import { NextResponse } from 'next/server';
import { prisma, getTursoConfig } from '@/lib/prisma';

export async function GET() {
  const config = getTursoConfig();
  const tokenMasked = config.authToken
    ? `${config.authToken.slice(0, 8)}...${config.authToken.slice(-6)} (length: ${config.authToken.length})`
    : 'MISSING (undefined)';

  try {
    const userCount = await prisma.user.count();
    const sampleUser = await prisma.user.findFirst({ select: { username: true, role: true } });
    return NextResponse.json({
      status: 'healthy',
      isTurso: config.isTurso,
      tursoUrl: config.url,
      tursoToken: tokenMasked,
      userCount,
      sampleUser,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: 'error',
        isTurso: config.isTurso,
        tursoUrl: config.url,
        tursoToken: tokenMasked,
        error: message,
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}

