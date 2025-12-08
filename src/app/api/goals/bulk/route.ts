import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GoalStatus } from '@prisma/client';
import { z } from 'zod';

const bulkUpdateSchema = z.object({
  goalIds: z.array(z.string().cuid()).min(1),
  updates: z.object({
    status: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
    progress: z.number().int().min(0).max(100).optional(),
  }),
});

const bulkDeleteSchema = z.object({
  goalIds: z.array(z.string().cuid()).min(1),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = bulkUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { goalIds, updates } = parsed.data;

    // Проверяем, что все цели принадлежат пользователю
    const goals = await prisma.goal.findMany({
      where: {
        id: { in: goalIds },
        ownerId: session.user.id,
      },
    });

    if (goals.length !== goalIds.length) {
      return NextResponse.json({ error: 'Some goals not found or access denied' }, { status: 403 });
    }

    // Обновляем цели
    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (typeof updates.progress === 'number') updateData.progress = updates.progress;
    if (updates.status === GoalStatus.COMPLETED && typeof updates.progress === 'undefined') {
      updateData.progress = 100;
    }

    const result = await prisma.goal.updateMany({
      where: {
        id: { in: goalIds },
        ownerId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json({ data: { updated: result.count } });
  } catch (error) {
    console.error('[GOALS_BULK_UPDATE]', error);
    return NextResponse.json({ error: 'Failed to update goals' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = bulkDeleteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { goalIds } = parsed.data;

    // Проверяем, что все цели принадлежат пользователю
    const goals = await prisma.goal.findMany({
      where: {
        id: { in: goalIds },
        ownerId: session.user.id,
      },
    });

    if (goals.length !== goalIds.length) {
      return NextResponse.json({ error: 'Some goals not found or access denied' }, { status: 403 });
    }

    const result = await prisma.goal.deleteMany({
      where: {
        id: { in: goalIds },
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ data: { deleted: result.count } });
  } catch (error) {
    console.error('[GOALS_BULK_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete goals' }, { status: 500 });
  }
}

