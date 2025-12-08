import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoalTemplateService } from '@/lib/services/goalTemplateService';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['QUARTERLY', 'MONTHLY', 'WEEKLY']).optional(),
  title: z.string().min(1).max(200).optional(),
  defaultDescription: z.string().max(2000).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const template = await GoalTemplateService.getTemplate(resolvedParams.id, session.user.id);
    return NextResponse.json({ data: template });
  } catch (error) {
    if (error instanceof Error && error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[GOAL_TEMPLATE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const json = await req.json();
    const parsed = updateTemplateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const template = await GoalTemplateService.updateTemplate(
      resolvedParams.id,
      parsed.data,
      session.user.id,
    );
    return NextResponse.json({ data: template });
  } catch (error) {
    if (error instanceof Error && error.message === 'Template not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[GOAL_TEMPLATE_PATCH]', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    await GoalTemplateService.deleteTemplate(resolvedParams.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Template not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[GOAL_TEMPLATE_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

