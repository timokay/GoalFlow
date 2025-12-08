import { BotContext } from '../bot';

export async function handleLinkCommand(ctx: BotContext) {
  const telegramId = ctx.from?.id?.toString();

  if (!telegramId) {
    await ctx.reply('❌ Не удалось определить ваш Telegram ID.');
    return;
  }

  if (ctx.user) {
    await ctx.reply(
      `✅ Ваш аккаунт уже привязан!\n\n` +
        `Telegram ID: ${telegramId}\n` +
        `Email: ${ctx.user.email}\n\n` +
        `Используйте /goals для просмотра целей.`,
    );
    return;
  }

  // Генерируем уникальный токен для привязки
  const linkToken = Buffer.from(`${telegramId}:${Date.now()}`).toString('base64');
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  const linkUrl = `${baseUrl}/settings/telegram?token=${linkToken}`;

  await ctx.reply(
    `🔗 *Привязка аккаунта GoalFlow*\n\n` +
      `Для привязки вашего Telegram аккаунта:\n\n` +
      `1. Перейдите по ссылке:\n${linkUrl}\n\n` +
      `2. Войдите в свой аккаунт GoalFlow\n` +
      `3. Подтвердите привязку\n\n` +
      `Ваш Telegram ID: \`${telegramId}\`\n\n` +
      `После привязки вы сможете получать уведомления и использовать команды бота.`,
    { parse_mode: 'Markdown' },
  );
}

