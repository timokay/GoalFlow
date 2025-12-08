import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceInviteService } from '@/lib/services/workspaceInviteService';
import { z } from 'zod';

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const invites = await WorkspaceInviteService.getWorkspaceInvites(
      resolvedParams.id,
      session.user.id,
    );
    return NextResponse.json({ data: invites });
  } catch (error) {
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[WORKSPACE_INVITES_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const json = await req.json();
    const parsed = createInviteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const invite = await WorkspaceInviteService.createInvite({
      email: parsed.data.email,
      role: parsed.data.role || 'MEMBER',
      workspaceId: resolvedParams.id,
      invitedBy: session.user.id,
    });
    return NextResponse.json({ data: invite }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Invite already sent') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[WORKSPACE_INVITES_POST]', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

