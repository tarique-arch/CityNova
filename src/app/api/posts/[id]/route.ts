import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { syncUserCivicScore } from '@/lib/civic-score';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { caseId: id }],
      },
      select: {
        id: true,
        reporterId: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (ticket.reporterId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are only authorized to delete your own posts.' },
        { status: 403 }
      );
    }

    await prisma.ticket.delete({
      where: { id: ticket.id },
    });

    // Recalculate civic score for author
    await syncUserCivicScore(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post.' }, { status: 500 });
  }
}
