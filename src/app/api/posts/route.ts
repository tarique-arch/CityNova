import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session?.user.cityId || !session.user.city) {
      return NextResponse.json({ error: 'Please sign in to view city posts.' }, { status: 401 });
    }

    const cityFilter: Prisma.TicketWhereInput = session.user.city.normalizedKey === 'ponda,goa,india'
      ? { OR: [{ cityId: session.user.cityId }, { cityId: null }] }
      : { cityId: session.user.cityId };

    // Fetch starred user IDs safely via raw query so it never conflicts with in-memory Prisma client cache
    let starredIdSet = new Set<string>();
    try {
      const starredRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM User WHERE isStarred = 1'
      );
      starredIdSet = new Set(starredRows.map((r) => r.id));
    } catch {}

    const tickets = await prisma.ticket.findMany({
      where: cityFilter,
      select: {
        id: true,
        caseId: true,
        title: true,
        description: true,
        category: true,
        status: true,
        addressDescription: true,
        initialPhotoUrl: true,
        createdAt: true,
        reporter: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            role: true,
            civicScore: true,
            isBanned: true,
          },
        },
        reactions: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        _count: { select: { reactions: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            body: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
                role: true,
                designation: true,
                civicScore: true,
                isBanned: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const posts = tickets.map((ticket) => ({
      id: ticket.id,
      caseId: ticket.caseId,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status === 'RESOLVED' ? 'CLOSED' : ticket.status,
      addressDescription: ticket.addressDescription ? ticket.addressDescription.replace(/\s*\(Ward\s+\d+\)/gi, '') : '',
      initialPhotoUrl: ticket.initialPhotoUrl,
      createdAt: ticket.createdAt,
      authorId: ticket.reporter?.id,
      authorUsername: ticket.reporter?.username || 'citizen',
      authorName: ticket.reporter?.name || 'Citizen',
      authorAvatarUrl: ticket.reporter?.avatarUrl || null,
      authorRole: ticket.reporter?.role || 'CITIZEN',
      authorCivicScore: ticket.reporter?.civicScore ?? 50,
      authorIsBanned: Boolean(ticket.reporter?.isBanned),
      authorIsStarred: ticket.reporter?.id ? starredIdSet.has(ticket.reporter.id) : false,
      plusOneCount: ticket._count.reactions,
      reactedByMe: ticket.reactions.length > 0,
      comments: ticket.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        authorId: comment.userId,
        authorUsername: comment.user?.username || 'citizen',
        authorName: comment.user?.name || 'Citizen',
        authorAvatarUrl: comment.user?.avatarUrl || null,
        authorRole: comment.user?.role,
        authorDesignation: comment.user?.designation || null,
        authorCivicScore: comment.user?.civicScore ?? 50,
        authorIsBanned: Boolean(comment.user?.isBanned),
        authorIsStarred: comment.userId ? starredIdSet.has(comment.userId) : false,
      })),
    }));

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching city posts:', error);
    return NextResponse.json({ error: 'Could not load city posts.' }, { status: 500 });
  }
}
