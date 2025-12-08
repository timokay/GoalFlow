import { Bot, Context } from 'grammy';
import { prisma } from '../db';
import { User } from '@prisma/client';
import { handleStartCommand } from './commands/start';
import { handleHelpCommand } from './commands/help';
import { handleGoalsCommand } from './commands/goals';
import { handleReportCommand } from './commands/report';
import { handleLinkCommand } from './commands/link';

// Расширяем Context для добавления пользователя
export type BotContext = Context & {
  user: User | null;
};

let botInstance: Bot | null = null;

function initializeBot() {
  if (botInstance) {
    return botInstance;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  botInstance = new Bot(token);

  // Middleware для получения пользователя из БД
  botInstance.use(async (ctx, next) => {
    if (ctx.from?.id) {
      const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from.id.toString() },
      });
      (ctx as BotContext).user = user || null;
    } else {
      (ctx as BotContext).user = null;
    }
    return next();
  });

  // Команды
  botInstance.command('start', (ctx) => handleStartCommand(ctx as BotContext));
  botInstance.command('help', (ctx) => handleHelpCommand(ctx as BotContext));
  botInstance.command('goals', (ctx) => handleGoalsCommand(ctx as BotContext));
  botInstance.command('report', (ctx) => handleReportCommand(ctx as BotContext));
  botInstance.command('link', (ctx) => handleLinkCommand(ctx as BotContext));

  // Обработка неизвестных команд
  botInstance.on('message', async (ctx) => {
    if (ctx.message.text?.startsWith('/')) {
      await ctx.reply('Неизвестная команда. Используйте /help для списка команд.');
    }
  });

  // Обработка ошибок
  botInstance.catch((err) => {
    console.error('Telegram bot error:', err);
  });

  return botInstance;
}

// Экспортируем функцию для получения бота (ленивая инициализация)
export function getBot(): Bot {
  return initializeBot();
}

// Экспортируем объект-прокси для обратной совместимости
export const bot = new Proxy({} as Bot, {
  get(_target, prop) {
    try {
      const bot = getBot();
      return (bot as any)[prop];
    } catch {
      // Если токен не установлен, возвращаем заглушку
      return undefined;
    }
  },
});
