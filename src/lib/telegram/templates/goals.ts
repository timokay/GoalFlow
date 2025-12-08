import { Goal } from '@prisma/client';

const statusEmoji = {
  DRAFT: '📝',
  ACTIVE: '🔄',
  REVIEW: '⏳',
  COMPLETED: '✅',
  CANCELLED: '❌',
};

const typeLabels = {
  QUARTERLY: 'Квартальная',
  MONTHLY: 'Месячная',
  WEEKLY: 'Недельная',
};

export function formatGoalsList(goals: Goal[]): string {
  if (goals.length === 0) {
    return '📝 У вас пока нет целей.';
  }

  let message = `📋 *Ваши цели* (${goals.length})\n\n`;

  goals.slice(0, 10).forEach((goal, index) => {
    const emoji = statusEmoji[goal.status];
    const type = typeLabels[goal.type];
    const progressBar = getProgressBar(goal.progress);
    const endDate = new Date(goal.endDate).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });

    message +=
      `${emoji} *${goal.title}*\n` +
      `Тип: ${type} | Прогресс: ${goal.progress}%\n` +
      `${progressBar}\n` +
      `Дедлайн: ${endDate}\n\n`;
  });

  if (goals.length > 10) {
    message += `\n_Показано 10 из ${goals.length} целей. Используйте веб-интерфейс для просмотра всех._`;
  }

  return message;
}

function getProgressBar(progress: number, length = 10): string {
  const filled = Math.round((progress / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

