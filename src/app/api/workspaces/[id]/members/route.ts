import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceService } from '@/lib/services/workspaceService';
import { addWorkspaceMemberSchema, updateWorkspaceMemberSchema } from '@/lib/validations';

async function ensureSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    const members = await WorkspaceService.getWorkspaceMembers(resolvedParams.id, session.user.id);
    return NextResponse.json({ data: members });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Workspace access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[WORKSPACE_MEMBERS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    const json = await req.json();
    const parsed = addWorkspaceMemberSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const member = await WorkspaceService.addWorkspaceMember(
      resolvedParams.id,
      { email: parsed.data.email, role: parsed.data.role || 'MEMBER' },
      session.user.id,
    );
    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Workspace access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'User is already a member') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[WORKSPACE_MEMBERS_POST]', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

