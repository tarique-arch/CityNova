import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session || session.user.role !== 'AUTHORITY') {
      return NextResponse.json({ error: 'Only Municipal Authority accounts can view star citizens.' }, { status: 403 });
    }

    let starredUsers: any[] = [];
    try {
      starredUsers = await prisma.$queryRawUnsafe(
        'SELECT id, name, username, avatarUrl, civicScore, isStarred, starredReason, starredAt, starredBy, isBanned, createdAt FROM User WHERE isStarred = 1 ORDER BY starredAt DESC'
      );
    } catch (e) {
      console.error('Error in star GET query:', e);
    }

    return NextResponse.json({ success: true, starredUsers });
  } catch (error) {
    console.error('Error fetching starred users:', error);
    return NextResponse.json({ error: 'Failed to retrieve star citizens list.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session || session.user.role !== 'AUTHORITY') {
      return NextResponse.json({ error: 'Only Municipal Authority accounts can manage star citizens.' }, { status: 403 });
    }

    const body = await req.json();
    const { citizenId, username, action = 'STAR', reason } = body;

    const cleanUsername = username ? String(username).replace(/^@/, '').trim() : undefined;
    const whereClause = citizenId
      ? { id: citizenId }
      : cleanUsername
      ? { username: cleanUsername }
      : null;

    if (!whereClause) {
      return NextResponse.json({ error: 'Citizen ID or username is required.' }, { status: 400 });
    }

    const citizen = await prisma.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        civicScore: true,
      },
    });

    if (!citizen) {
      return NextResponse.json({ error: 'Citizen account not found.' }, { status: 404 });
    }

    if (action === 'UNSTAR') {
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE User SET isStarred = 0, starredReason = NULL, starredAt = NULL, starredBy = NULL WHERE id = ?',
          citizen.id
        );
      } catch (e) {
        console.error('Error unstarring user in db:', e);
      }

      return NextResponse.json({
        success: true,
        action: 'UNSTAR',
        message: `@${citizen.username || citizen.name} has been removed from the star citizens list.`,
        user: { ...citizen, isStarred: false },
      });
    }

    // Default: STAR
    const starredReasonText = (typeof reason === 'string' && reason.trim())
      ? reason.trim()
      : 'Recognized by Municipal Authority for filing genuine, high-quality civic issues.';

    try {
      await prisma.$executeRawUnsafe(
        'UPDATE User SET isStarred = 1, starredReason = ?, starredAt = ?, starredBy = ? WHERE id = ?',
        starredReasonText,
        new Date().toISOString(),
        session.user.name,
        citizen.id
      );
    } catch (e) {
      console.error('Error starring user in db:', e);
    }

    return NextResponse.json({
      success: true,
      action: 'STAR',
      message: `Citizen @${citizen.username || citizen.name} has been marked as a Star Citizen!`,
      user: { ...citizen, isStarred: true, starredReason: starredReasonText },
    });
  } catch (error) {
    console.error('Error in star action:', error);
    return NextResponse.json({ error: 'Failed to update citizen star status.' }, { status: 500 });
  }
}
