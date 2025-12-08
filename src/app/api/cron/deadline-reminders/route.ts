import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * Cron job endpoint для проверки дедлайнов и отправки напоминаний
 * Вызывается ежедневно (можно настроить через Vercel Cron или внешний сервис)
 */
export async function GET(req: Request) {
  // Проверка авторизации через заголовок (для Vercel Cron)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Находим все активные цели с дедлайнами в ближайшие дни
    const activeGoals = await prisma.goal.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'REVIEW'],
        },
        endDate: {
          gte: today,
          lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 дней вперед
        },
      },
      include: {
        owner: {
          include: {
            notificationPreferences: true,
          },
        },
      },
    });

    const remindersSent: string[] = [];

    for (const goal of activeGoals) {
      const daysUntilDeadline = Math.ceil(
        (goal.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      const prefs = goal.owner.notificationPreferences;
      if (
        prefs &&
        prefs.deadlineReminderDays &&
        prefs.deadlineReminderDays.includes(daysUntilDeadline)
      ) {
        await NotificationService.sendDeadlineReminderNotification(
          goal.ownerId,
          goal.title,
          daysUntilDeadline,
        );
        remindersSent.push(goal.id);
      }
    }

    return NextResponse.json({
      success: true,
      goalsChecked: activeGoals.length,
      remindersSent: remindersSent.length,
      goalIds: remindersSent,
    });
  } catch (error) {
    console.error('[DEADLINE_REMINDERS_CRON]', error);
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 });
  }
}

