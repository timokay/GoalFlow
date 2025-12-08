import { prisma } from '../db';
import { EmailService } from './emailService';
import { TelegramService } from './telegramService';

export class NotificationService {
  static async sendStatusChangeNotification(
    userId: string,
    goalTitle: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true },
    });

    if (!user) return;

    const prefs = user.notificationPreferences;

    // Email notification
    if (prefs?.emailEnabled && prefs?.statusChangeEmail) {
      EmailService.sendGoalStatusChangeNotification(
        user.email,
        goalTitle,
        oldStatus,
        newStatus,
      ).catch(console.error);
    }

    // Telegram notification
    if (prefs?.telegramEnabled && prefs?.statusChangeTelegram && user.telegramId) {
      TelegramService.sendStatusChangeNotification(
        userId,
        goalTitle,
        oldStatus,
        newStatus,
      ).catch(console.error);
    }
  }

  static async sendProgressUpdateNotification(
    userId: string,
    goalTitle: string,
    progress: number,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true },
    });

    if (!user) return;

    const prefs = user.notificationPreferences;

    // Email notification
    if (prefs?.emailEnabled && prefs?.progressUpdateEmail) {
      EmailService.sendProgressUpdateNotification(user.email, goalTitle, progress).catch(
        console.error,
      );
    }

    // Telegram notification
    if (prefs?.telegramEnabled && prefs?.progressUpdateTelegram && user.telegramId) {
      TelegramService.sendProgressUpdate(userId, goalTitle, progress).catch(console.error);
    }
  }

  static async sendDeadlineReminderNotification(
    userId: string,
    goalTitle: string,
    daysLeft: number,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true },
    });

    if (!user) return;

    const prefs = user.notificationPreferences;

    // Check if reminder should be sent for this number of days
    if (
      prefs?.deadlineReminderDays &&
      !prefs.deadlineReminderDays.includes(daysLeft)
    ) {
      return;
    }

    // Email notification
    if (prefs?.emailEnabled && prefs?.deadlineReminderEmail) {
      EmailService.sendDeadlineReminderNotification(user.email, goalTitle, daysLeft).catch(
        console.error,
      );
    }

    // Telegram notification
    if (prefs?.telegramEnabled && prefs?.deadlineReminderTelegram && user.telegramId) {
      TelegramService.sendDeadlineReminder(userId, goalTitle, daysLeft).catch(console.error);
    }
  }

  static async getOrCreateNotificationPreferences(userId: string) {
    let prefs = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    return prefs;
  }

  static async updateNotificationPreferences(
    userId: string,
    data: {
      emailEnabled?: boolean;
      telegramEnabled?: boolean;
      statusChangeEmail?: boolean;
      statusChangeTelegram?: boolean;
      progressUpdateEmail?: boolean;
      progressUpdateTelegram?: boolean;
      deadlineReminderEmail?: boolean;
      deadlineReminderTelegram?: boolean;
      deadlineReminderDays?: number[];
    },
  ) {
    await this.getOrCreateNotificationPreferences(userId);

    return prisma.notificationPreferences.update({
      where: { userId },
      data,
    });
  }
}

