import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActivityService } from '@/lib/services/activityService';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    let activities;
    if (workspaceId) {
      activities = await ActivityService.getWorkspaceActivities(
        workspaceId,
        session.user.id,
        limit,
      );
    } else {
      activities = await ActivityService.getUserActivities(session.user.id, limit);
    }

    return NextResponse.json({ data: activities });
  } catch (error) {
    if (error instanceof Error && error.message === 'Workspace access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[ACTIVITIES_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

