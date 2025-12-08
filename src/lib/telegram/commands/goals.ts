import { BotContext } from '../bot';
import { GoalService } from '@/lib/services/goalService';
import { WorkspaceService } from '@/lib/services/workspaceService';
import { formatGoalsList } from '../templates/goals';

export async function handleGoalsCommand(ctx: BotContext) {
  if (!ctx.user) {
    await ctx.reply(
      '❌ Ваш аккаунт не привязан. Используйте /link для привязки аккаунта.',
    );
    return;
  }

  try {
    // Получаем первый workspace пользователя
    const workspace = await WorkspaceService.getDefaultWorkspace(ctx.user.id);
    if (!workspace) {
      await ctx.reply('❌ У вас нет доступных workspace. Создайте workspace в веб-интерфейсе.');
      return;
    }

    const goals = await GoalService.listGoals(ctx.user.id, workspace.id);

    if (goals.length === 0) {
      await ctx.reply('📝 У вас пока нет целей. Создайте первую цель в веб-интерфейсе!');
      return;
    }

    const message = formatGoalsList(goals);
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in goals command:', error);
    await ctx.reply('❌ Произошла ошибка при получении целей. Попробуйте позже.');
  }
}

