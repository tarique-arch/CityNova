import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    if (!session?.user.cityId || !session.user.city) {
      return NextResponse.json({ error: 'Please sign in to comment on a post.' }, { status: 401 });
    }
    if (session.user.isBanned) {
      return NextResponse.json({
        error: session.user.banReason || 'Your account has been restricted by Municipal Authority from posting comments.',
        isBanned: true,
      }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Enter a comment before posting.' }, { status: 400 });
    }
    const commentText = typeof body === 'object' && body !== null && 'body' in body && typeof body.body === 'string'
      ? body.body.trim()
      : '';
    if (!commentText || commentText.length > 1000) {
      return NextResponse.json({ error: 'Comments must be between 1 and 1000 characters.' }, { status: 400 });
    }

    const { id } = await params;
    const cityFilter = session.user.city.normalizedKey === 'ponda,goa,india'
      ? { OR: [{ cityId: session.user.cityId }, { cityId: null }] }
      : { cityId: session.user.cityId };
    const ticket = await prisma.ticket.findFirst({ where: { AND: [{ id }, cityFilter] }, select: { id: true } });
    if (!ticket) return NextResponse.json({ error: 'Post not found in your city.' }, { status: 404 });

    const comment = await prisma.ticketComment.create({
      data: { ticketId: ticket.id, userId: session.user.id, body: commentText },
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true, avatarUrl: true, role: true, designation: true, civicScore: true, isBanned: true } },
      },
    });

    let isStarred = false;
    try {
      const starRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM User WHERE id = ? AND isStarred = 1 LIMIT 1',
        comment.userId
      );
      isStarred = starRows.length > 0;
    } catch {}

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        authorId: comment.userId,
        authorUsername: comment.user.username || 'citizen',
        authorName: comment.user.name || 'Citizen',
        authorAvatarUrl: comment.user.avatarUrl || null,
        authorRole: comment.user.role,
        authorDesignation: comment.user.designation || null,
        authorCivicScore: comment.user.civicScore ?? 50,
        authorIsBanned: Boolean(comment.user.isBanned),
        authorIsStarred: isStarred,
      },
    });
  } catch (error) {
    console.error('Error creating post comment:', error);
    return NextResponse.json({ error: 'Could not post your comment.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request);
    if (!session?.user.id) {
      return NextResponse.json({ error: 'Please sign in to edit your comment.' }, { status: 401 });
    }
    if (session.user.isBanned) {
      return NextResponse.json({
        error: session.user.banReason || 'Your account has been restricted by Municipal Authority.',
        isBanned: true,
      }, { status: 403 });
    }

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { commentId, body } = (typeof requestBody === 'object' && requestBody !== null)
      ? (requestBody as { commentId?: unknown; body?: unknown })
      : {};

    if (typeof commentId !== 'string' || !commentId) {
      return NextResponse.json({ error: 'Comment ID is required.' }, { status: 400 });
    }

    const trimmedBody = typeof body === 'string' ? body.trim() : '';
    if (!trimmedBody || trimmedBody.length > 1000) {
      return NextResponse.json({ error: 'Comments must be between 1 and 1000 characters.' }, { status: 400 });
    }

    const { id } = await params;
    const existingComment = await prisma.ticketComment.findFirst({
      where: { id: commentId, ticketId: id },
      select: { id: true, userId: true },
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found on this post.' }, { status: 404 });
    }

    if (existingComment.userId !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'You can only edit your own comment.' }, { status: 403 });
    }

    const updated = await prisma.ticketComment.update({
      where: { id: commentId },
      data: { body: trimmedBody },
      select: {
        id: true,
        body: true,
        createdAt: true,
        userId: true,
        user: { select: { username: true, name: true, avatarUrl: true, role: true, designation: true, civicScore: true, isBanned: true } },
      },
    });

    let isStarred = false;
    try {
      const starRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM User WHERE id = ? AND isStarred = 1 LIMIT 1',
        updated.userId
      );
      isStarred = starRows.length > 0;
    } catch {}

    return NextResponse.json({
      success: true,
      comment: {
        id: updated.id,
        body: updated.body,
        createdAt: updated.createdAt,
        authorId: updated.userId,
        authorUsername: updated.user.username || 'citizen',
        authorName: updated.user.name || 'Citizen',
        authorAvatarUrl: updated.user.avatarUrl || null,
        authorRole: updated.user.role,
        authorDesignation: updated.user.designation || null,
        authorCivicScore: updated.user.civicScore ?? 50,
        authorIsBanned: Boolean(updated.user.isBanned),
        authorIsStarred: isStarred,
      },
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Could not update your comment.' }, { status: 500 });
  }
}
