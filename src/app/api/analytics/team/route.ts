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

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    const teamMetrics = await StatsService.getTeamPerformanceMetrics(
      workspaceId,
      session.user.id,
    );
    return NextResponse.json({ data: teamMetrics });
  } catch (error) {
    if (error instanceof Error && error.message === 'Workspace access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[TEAM_METRICS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch team metrics' }, { status: 500 });
  }
}

