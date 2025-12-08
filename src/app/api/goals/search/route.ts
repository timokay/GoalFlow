import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { sanitizeInput } from '@/lib/utils/security';

async function handleSearch(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('q');
  const workspaceId = searchParams.get('workspaceId');
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  if (!rawQuery || rawQuery.trim().length === 0) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  // Sanitize search query
  const query = sanitizeInput(rawQuery.trim());

  try {
    const where: any = {
      ownerId: session.user.id,
      workspaceId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        metrics: true,
        children: true,
        parent: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 50, // Ограничение результатов
    });

    return NextResponse.json({ data: goals, count: goals.length });
  } catch (error) {
    console.error('[GOALS_SEARCH]', error);
    return NextResponse.json({ error: 'Failed to search goals' }, { status: 500 });
  }
}

export const GET = withRateLimit(handleSearch, 'search');

