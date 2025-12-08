import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceInviteService } from '@/lib/services/workspaceInviteService';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    await WorkspaceInviteService.cancelInvite(resolvedParams.inviteId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invite not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[INVITE_DELETE]', error);
    return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 });
  }
}

