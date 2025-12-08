import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoalTemplateService } from '@/lib/services/goalTemplateService';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['QUARTERLY', 'MONTHLY', 'WEEKLY']),
  title: z.string().min(1).max(200),
  defaultDescription: z.string().max(2000).optional(),
  workspaceId: z.string().cuid().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  try {
    const templates = await GoalTemplateService.getUserTemplates(
      session.user.id,
      workspaceId || undefined,
    );
    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error('[GOAL_TEMPLATES_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = createTemplateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const template = await GoalTemplateService.createTemplate(parsed.data, session.user.id);
    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Workspace access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[GOAL_TEMPLATES_POST]', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

