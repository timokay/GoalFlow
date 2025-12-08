import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoalTemplateService } from '@/lib/services/goalTemplateService';
import { z } from 'zod';

const createGoalFromTemplateSchema = z.object({
  workspaceId: z.string().cuid(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const json = await req.json();
    const parsed = createGoalFromTemplateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const goal = await GoalTemplateService.createGoalFromTemplate(
      resolvedParams.id,
      session.user.id,
      parsed.data.workspaceId,
    );
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[CREATE_GOAL_FROM_TEMPLATE]', error);
    return NextResponse.json({ error: 'Failed to create goal from template' }, { status: 500 });
  }
}

