import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getAuthSession(request);
    const { username } = await params;
    const cleanUsername = decodeURIComponent(username).replace(/^@/, '').trim();

    if (!cleanUsername) {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Authentication required to view citizen profiles.' }, { status: 401 });
    }

    // Role check: Only Municipal Authority accounts can view other citizens' profiles
    if (
      session.user.role !== 'AUTHORITY' &&
      session.user.username?.toLowerCase() !== cleanUsername.toLowerCase() &&
      session.user.id !== cleanUsername
    ) {
      return NextResponse.json(
        { error: 'Citizen profiles can only be viewed by Municipal Authority officials.' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { username: cleanUsername.toLowerCase() },
          { id: cleanUsername },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        designation: true,
        bio: true,
        civicScore: true,
        isBanned: true,
        banReason: true,
        bannedAt: true,
        bannedBy: true,
        createdAt: true,
        city: {
          select: {
            id: true,
            name: true,
            state: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Citizen profile not found.' }, { status: 404 });
    }

    // Safely load star info via raw query
    let isStarred = false;
    let starredReason: string | null = null;
    let starredAt: string | null = null;
    let starredBy: string | null = null;
    try {
      const starRows = await prisma.$queryRawUnsafe<any[]>(
        'SELECT isStarred, starredReason, starredAt, starredBy FROM User WHERE id = ? LIMIT 1',
        user.id
      );
      if (starRows && starRows.length > 0) {
        isStarred = Boolean(starRows[0].isStarred);
        starredReason = starRows[0].starredReason || null;
        starredAt = starRows[0].starredAt || null;
        starredBy = starRows[0].starredBy || null;
      }
    } catch {}

    const tickets = await prisma.ticket.findMany({
      where: { reporterId: user.id },
      select: {
        id: true,
        caseId: true,
        title: true,
        description: true,
        category: true,
        status: true,
        addressDescription: true,
        createdAt: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mappedTickets = tickets.map((t) => ({
      ...t,
      addressDescription: t.addressDescription ? t.addressDescription.replace(/\s*\(Ward\s+\d+\)/gi, '') : '',
      commentsCount: t._count.comments,
      reactionsCount: t._count.reactions,
    }));

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        isStarred,
        starredReason,
        starredAt,
        starredBy,
        tickets: mappedTickets,
      },
    });
  } catch (error) {
    console.error('Error fetching citizen profile:', error);
    return NextResponse.json({ error: 'Failed to load citizen profile.' }, { status: 500 });
  }
}
