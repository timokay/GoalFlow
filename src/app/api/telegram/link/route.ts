import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TelegramService } from '@/lib/services/telegramService';
import { z } from 'zod';

const linkSchema = z.object({
  telegramId: z.string().min(1, 'Telegram ID is required'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = linkSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const success = await TelegramService.linkTelegramAccount(
      session.user.id,
      parsed.data.telegramId,
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to link Telegram account' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TELEGRAM_LINK]', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to link account' }, { status: 500 });
  }
}

