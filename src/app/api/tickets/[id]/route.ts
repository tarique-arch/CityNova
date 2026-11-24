import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeTicketForPublic } from '@/lib/privacy';
import { findCivicMemoryNearby } from '@/lib/gis';
import { getAuthSession } from '@/lib/auth';
import { syncUserCivicScore } from '@/lib/civic-score';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user.cityId || !session.user.city) return NextResponse.json({ error: 'Please sign in to view complaint dockets.' }, { status: 401 });
    const { id } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        AND: [
          { OR: [{ id }, { caseId: id }] },
          session.user.city.normalizedKey === 'ponda,goa,india'
            ? { OR: [{ cityId: session.user.cityId }, { cityId: null }] }
            : { cityId: session.user.cityId },
        ],
      },
      include: {
        city: true,
        reporter: {
          select: {
            id: true,
            name: true,
            username: true,
            civicScore: true,
            isBanned: true,
            banReason: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Civic ticket not found' }, { status: 404 });
    }

    // Civic Memory: find past fixes within 150m
    const civicMemory = await findCivicMemoryNearby(ticket.latitude, ticket.longitude, 150, session.user.cityId);
    // Filter out current ticket if it matches
    const pastNearbyFixes = civicMemory.filter((m) => m.id !== ticket.id);

    const processedTicket = {
      ...sanitizeTicketForPublic(ticket),
      reporterUsername: ticket.reporter?.username ?? null,
      reporterCivicScore: ticket.reporter?.civicScore ?? 50,
      reporterIsBanned: Boolean(ticket.reporter?.isBanned),
      reporterDetails: session.user.role === 'AUTHORITY' && ticket.reporter ? {
        id: ticket.reporter.id,
        name: ticket.reporter.name,
        username: ticket.reporter.username,
        civicScore: ticket.reporter.civicScore ?? 50,
        isBanned: Boolean(ticket.reporter.isBanned),
        banReason: ticket.reporter.banReason,
      } : null,
    };

    const isReporter = Boolean(
      ticket.reporterId &&
      session.user?.id &&
      session.user.role === 'CITIZEN' &&
      ticket.reporterId === session.user.id
    );
    const canUpdateResolution = isReporter;

    return NextResponse.json({
      success: true,
      ticket: processedTicket,
      isReporter,
      canUpdateResolution,
      civicMemory: pastNearbyFixes.map((m) => sanitizeTicketForPublic(m)),
    });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session) return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
  return NextResponse.json({ error: 'Citizen accounts cannot update official complaint status.' }, { status: 403 });
}

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
      return NextResponse.json({ error: 'Complaint docket not found.' }, { status: 404 });
    }

    if (ticket.reporterId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are only authorized to delete your own complaints.' },
        { status: 403 }
      );
    }

    await prisma.ticket.delete({
      where: { id: ticket.id },
    });

    await syncUserCivicScore(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Complaint deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json({ error: 'Failed to delete complaint.' }, { status: 500 });
  }
}
