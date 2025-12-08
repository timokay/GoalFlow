import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceService } from '@/lib/services/workspaceService';
import { createWorkspaceSchema } from '@/lib/validations';

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createWorkspaceSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const workspace = await WorkspaceService.createWorkspace(parsed.data, session.user.id);
    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (error) {
    console.error('[WORKSPACES_POST]', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
