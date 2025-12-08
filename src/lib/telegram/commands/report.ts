import { BotContext } from '../bot';
import { StatsService } from '@/lib/services/statsService';
import { WorkspaceService } from '@/lib/services/workspaceService';
import { formatReport } from '../templates/report';

export async function handleReportCommand(ctx: BotContext) {
  if (!ctx.user) {
    await ctx.reply(
      '❌ Ваш аккаунт не привязан. Используйте /link для привязки аккаунта.',
    );
    return;
  }

  try {
    const workspace = await WorkspaceService.getDefaultWorkspace(ctx.user.id);
    if (!workspace) {
      await ctx.reply('❌ У вас нет доступных workspace.');
      return;
    }

    const stats = await StatsService.getDashboardStats(ctx.user.id, workspace.id);
    const message = formatReport(stats, workspace.name);
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in report command:', error);
    await ctx.reply('❌ Произошла ошибка при формировании отчета. Попробуйте позже.');
  }
}

