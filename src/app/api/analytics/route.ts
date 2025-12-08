import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StatsService } from '@/lib/services/statsService';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const typeFilter = searchParams.get('type') as 'QUARTERLY' | 'MONTHLY' | 'WEEKLY' | null;

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    const analytics = await StatsService.getAnalytics(
      session.user.id,
      workspaceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      typeFilter || undefined,
    );
    return NextResponse.json({ data: analytics });
  } catch (error) {
    console.error('[ANALYTICS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

