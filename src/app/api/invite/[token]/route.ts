import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceInviteService } from '@/lib/services/workspaceInviteService';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const resolvedParams = await params;
    const invite = await WorkspaceInviteService.getInviteByToken(resolvedParams.token);
    return NextResponse.json({ data: invite });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invite not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Invite already accepted') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Invite expired') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error('[INVITE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 });
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const result = await WorkspaceInviteService.acceptInvite(resolvedParams.token, session.user.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invite not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === 'Invite already accepted') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Invite expired') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Email mismatch') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error('[INVITE_ACCEPT]', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}

