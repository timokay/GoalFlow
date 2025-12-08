import { DashboardStats } from '@/lib/services/statsService';

export function formatReport(stats: DashboardStats, workspaceName: string): string {
  const completionRate =
    stats.totalGoals > 0
      ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
      : 0;

  return (
    `📊 *Отчет по целям*\n` +
    `Workspace: ${workspaceName}\n\n` +
    `*Статистика:*\n` +
    `📝 Всего целей: ${stats.totalGoals}\n` +
    `🔄 Активных: ${stats.activeGoals}\n` +
    `✅ Завершено: ${stats.completedGoals}\n` +
    `⏳ На проверке: ${stats.pendingGoals}\n\n` +
    `*Показатели:*\n` +
    `Процент выполнения: ${completionRate}%\n\n` +
    `_Используйте /goals для детального просмотра._`
  );
}

