import { bot } from '../telegram/bot';
import { prisma } from '../db';
import {
  formatDeadlineReminder,
  formatStatusChange,
  formatProgressUpdate,
} from '../telegram/templates/notifications';

export class TelegramService {
  static async sendMessage(telegramId: string, message: string): Promise<boolean> {
    try {
      await bot.api.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${telegramId}:`, error);
      return false;
    }
  }

  static async sendDeadlineReminder(userId: string, goalTitle: string, daysLeft: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });

    if (!user?.telegramId) {
      return false;
    }

    const message = formatDeadlineReminder(goalTitle, daysLeft);
    return this.sendMessage(user.telegramId, message);
  }

  static async sendStatusChangeNotification(
    userId: string,
    goalTitle: string,
    oldStatus: string,
    newStatus: string,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });

    if (!user?.telegramId) {
      return false;
    }

    const message = formatStatusChange(goalTitle, oldStatus, newStatus);
    return this.sendMessage(user.telegramId, message);
  }

  static async sendProgressUpdate(userId: string, goalTitle: string, progress: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });

    if (!user?.telegramId) {
      return false;
    }

    const message = formatProgressUpdate(goalTitle, progress);
    return this.sendMessage(user.telegramId, message);
  }

  static async linkTelegramAccount(userId: string, telegramId: string): Promise<boolean> {
    try {
      // Проверяем, не привязан ли уже этот telegramId к другому аккаунту
      const existingUser = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Этот Telegram аккаунт уже привязан к другому пользователю');
      }

      await prisma.user.update({
        where: { id: userId },
        data: { telegramId },
      });

      return true;
    } catch (error) {
      console.error('Failed to link Telegram account:', error);
      return false;
    }
  }
}

