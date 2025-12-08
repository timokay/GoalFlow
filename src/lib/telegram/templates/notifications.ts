export function formatDeadlineReminder(goalTitle: string, daysLeft: number): string {
  if (daysLeft === 0) {
    return `⏰ *Дедлайн сегодня!*\n\nЦель "${goalTitle}" должна быть завершена сегодня.`;
  }
  if (daysLeft === 1) {
    return `⏰ *Дедлайн завтра!*\n\nЦель "${goalTitle}" должна быть завершена завтра.`;
  }
  return `⏰ *Напоминание о дедлайне*\n\nЦель "${goalTitle}" должна быть завершена через ${daysLeft} ${getDaysWord(daysLeft)}.`;
}

export function formatStatusChange(goalTitle: string, oldStatus: string, newStatus: string): string {
  const statusLabels = {
    DRAFT: 'Черновик',
    ACTIVE: 'Активна',
    REVIEW: 'На проверке',
    COMPLETED: 'Завершена',
    CANCELLED: 'Отменена',
  };

  return (
    `📢 *Изменение статуса цели*\n\n` +
    `Цель: "${goalTitle}"\n` +
    `Статус изменен: ${statusLabels[oldStatus as keyof typeof statusLabels]} → ${statusLabels[newStatus as keyof typeof statusLabels]}`
  );
}

export function formatProgressUpdate(goalTitle: string, progress: number): string {
  const progressBar = getProgressBar(progress);
  return (
    `📈 *Обновление прогресса*\n\n` +
    `Цель: "${goalTitle}"\n` +
    `Прогресс: ${progress}%\n` +
    progressBar
  );
}

function getProgressBar(progress: number, length = 10): string {
  const filled = Math.round((progress / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getDaysWord(days: number): string {
  if (days % 10 === 1 && days % 100 !== 11) {
    return 'день';
  }
  if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
    return 'дня';
  }
  return 'дней';
}

