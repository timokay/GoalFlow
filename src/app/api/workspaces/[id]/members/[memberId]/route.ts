import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceService } from '@/lib/services/workspaceService';
import { updateWorkspaceMemberSchema } from '@/lib/validations';

async function ensureSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    const json = await req.json();
    const parsed = updateWorkspaceMemberSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const member = await WorkspaceService.updateWorkspaceMemberRole(
      resolvedParams.id,
      resolvedParams.memberId,
      parsed.data.role,
      session.user.id,
    );
    return NextResponse.json({ data: member });
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
    if (error instanceof Error && error.message === 'Member not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Cannot change owner role') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[WORKSPACE_MEMBER_PATCH]', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    await WorkspaceService.removeWorkspaceMember(
      resolvedParams.id,
      resolvedParams.memberId,
      session.user.id,
    );
    return NextResponse.json({ success: true });
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
    if (error instanceof Error && error.message === 'Member not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Cannot remove workspace owner') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[WORKSPACE_MEMBER_DELETE]', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}

