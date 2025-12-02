import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoalService } from '@/lib/services/goalService';
import { updateGoalSchema } from '@/lib/validations';

async function ensureSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await ensureSession();
    const { id } = await params;
    const goal = await GoalService.getGoal(id, session.user.id);
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    return NextResponse.json({ data: goal });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[GOAL_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await ensureSession();
    const { id } = await params;
    const json = await req.json();
    const parsed = updateGoalSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const goal = await GoalService.updateGoal(id, parsed.data, session.user.id);
    return NextResponse.json({ data: goal });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Goal not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[GOAL_PATCH]', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await ensureSession();
    const { id } = await params;
    await GoalService.deleteGoal(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Goal not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[GOAL_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}

