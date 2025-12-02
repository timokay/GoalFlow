import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceService } from '@/lib/services/workspaceService';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workspaces = await WorkspaceService.getUserWorkspaces(session.user.id);
    return NextResponse.json({ data: workspaces });
  } catch (error) {
    console.error('[WORKSPACES_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

