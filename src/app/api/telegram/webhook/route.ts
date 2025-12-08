import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram/bot';
import { Update } from 'grammy/types';

export async function POST(req: NextRequest) {
  try {
    const update: Update = await req.json();

    // Быстрый ответ Telegram (webhook должен отвечать быстро)
    // Обработка происходит асинхронно
    bot.handleUpdate(update).catch((error) => {
      console.error('Error handling Telegram update:', error);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}

// GET для верификации webhook (опционально)
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Telegram webhook endpoint' });
}

