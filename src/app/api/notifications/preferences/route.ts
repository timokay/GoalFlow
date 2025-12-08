import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  telegramEnabled: z.boolean().optional(),
  statusChangeEmail: z.boolean().optional(),
  statusChangeTelegram: z.boolean().optional(),
  progressUpdateEmail: z.boolean().optional(),
  progressUpdateTelegram: z.boolean().optional(),
  deadlineReminderEmail: z.boolean().optional(),
  deadlineReminderTelegram: z.boolean().optional(),
  deadlineReminderDays: z.array(z.number().int().min(0).max(365)).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const prefs = await NotificationService.getOrCreateNotificationPreferences(session.user.id);
    return NextResponse.json({ data: prefs });
  } catch (error) {
    console.error('[NOTIFICATION_PREFERENCES_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = updatePreferencesSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const prefs = await NotificationService.updateNotificationPreferences(
      session.user.id,
      parsed.data,
    );
    return NextResponse.json({ data: prefs });
  } catch (error) {
    console.error('[NOTIFICATION_PREFERENCES_PATCH]', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}

