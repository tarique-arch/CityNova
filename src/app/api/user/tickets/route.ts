import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Please sign in to view your complaints.' }, { status: 401 });
    }

    const isAuthority = session.user.role === 'AUTHORITY';
    let whereCondition: Prisma.TicketWhereInput;

    if (isAuthority) {
      // For Authority: return tickets where this authority acted in status history,
      // or tickets filed by them
      whereCondition = {
        OR: [
          {
            statusHistory: {
              some: {
                actorId: session.user.id,
              },
            },
          },
          { reporterId: session.user.id },
        ],
      };
    } else {
      const orConditions: Prisma.TicketWhereInput[] = [
        { reporterId: session.user.id },
      ];

      if (session.user.phone) {
        orConditions.push({ citizenPhone: session.user.phone });
      }
      if (session.user.name) {
        orConditions.push({ citizenName: session.user.name });
      }

      whereCondition = { OR: orConditions };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereCondition,
      include: {
        city: true,
        _count: {
          select: { comments: true, reactions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const userTickets = tickets.map((t) => ({
      id: t.id,
      caseId: t.caseId,
      title: t.title,
      description: t.description,
      category: t.category,
      urgency: t.urgency,
      status: t.status,
      latitude: t.latitude,
      longitude: t.longitude,
      addressDescription: t.addressDescription.replace(/\s*\(Ward\s+\d+\)/gi, ''),
      cityName: t.city?.name || session.user.city?.name || 'Local Jurisdiction',
      state: t.city?.state || session.user.state || '',
      initialPhotoUrl: t.initialPhotoUrl,
      resolutionPhotoUrl: t.resolutionPhotoUrl,
      publicCommitmentDate: t.publicCommitmentDate,
      slaDeadline: t.slaDeadline,
      createdAt: t.createdAt,
      reactionsCount: t._count.reactions,
      commentsCount: t._count.comments,
    }));

    return NextResponse.json({ success: true, tickets: userTickets });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch user complaints' }, { status: 500 });
  }
}

