import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoalService } from '@/lib/services/goalService';
import { createGoalSchema } from '@/lib/validations';

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
    const goals = await GoalService.listGoals(session.user.id, workspaceId);
    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error('[GOALS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json();
  const parsed = createGoalSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const goal = await GoalService.createGoal(parsed.data, session.user.id);
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    console.error('[GOALS_POST]', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

