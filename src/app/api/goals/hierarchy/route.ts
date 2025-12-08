import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoalService } from '@/lib/services/goalService';

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
    const hierarchy = await GoalService.getGoalHierarchy(session.user.id, workspaceId);
    return NextResponse.json({ data: hierarchy });
  } catch (error) {
    console.error('[GOALS_HIERARCHY_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch goal hierarchy' }, { status: 500 });
  }
}

