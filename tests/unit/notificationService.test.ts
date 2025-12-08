import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NotificationService } from '@/lib/services/notificationService';
import { EmailService } from '@/lib/services/emailService';
import { TelegramService } from '@/lib/services/telegramService';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    notificationPreferences: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/emailService', () => ({
  EmailService: {
    sendGoalStatusChangeNotification: vi.fn().mockResolvedValue(true),
    sendProgressUpdateNotification: vi.fn().mockResolvedValue(true),
    sendDeadlineReminderNotification: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/lib/services/telegramService', () => ({
  TelegramService: {
    sendStatusChangeNotification: vi.fn().mockResolvedValue(undefined),
    sendProgressUpdate: vi.fn().mockResolvedValue(undefined),
    sendDeadlineReminder: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    telegramId: '123456789',
    notificationPreferences: {
      emailEnabled: true,
      telegramEnabled: true,
      statusChangeEmail: true,
      statusChangeTelegram: true,
      progressUpdateEmail: true,
      progressUpdateTelegram: true,
      deadlineReminderEmail: true,
      deadlineReminderTelegram: true,
      deadlineReminderDays: [7, 3, 1],
    },
  };

  it('sendStatusChangeNotification отправляет email и telegram уведомления', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await NotificationService.sendStatusChangeNotification(
      'user-1',
      'Test Goal',
      'DRAFT',
      'ACTIVE',
    );

    expect(EmailService.sendGoalStatusChangeNotification).toHaveBeenCalledWith(
      'user@example.com',
      'Test Goal',
      'DRAFT',
      'ACTIVE',
    );
    expect(TelegramService.sendStatusChangeNotification).toHaveBeenCalledWith(
      'user-1',
      'Test Goal',
      'DRAFT',
      'ACTIVE',
    );
  });

  it('sendStatusChangeNotification не отправляет уведомления если preferences отключены', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      notificationPreferences: {
        ...mockUser.notificationPreferences,
        statusChangeEmail: false,
        statusChangeTelegram: false,
      },
    } as any);

    await NotificationService.sendStatusChangeNotification(
      'user-1',
      'Test Goal',
      'DRAFT',
      'ACTIVE',
    );

    expect(EmailService.sendGoalStatusChangeNotification).not.toHaveBeenCalled();
    expect(TelegramService.sendStatusChangeNotification).not.toHaveBeenCalled();
  });

  it('sendProgressUpdateNotification отправляет уведомления об обновлении прогресса', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await NotificationService.sendProgressUpdateNotification('user-1', 'Test Goal', 50);

    expect(EmailService.sendProgressUpdateNotification).toHaveBeenCalledWith(
      'user@example.com',
      'Test Goal',
      50,
    );
    expect(TelegramService.sendProgressUpdate).toHaveBeenCalledWith('user-1', 'Test Goal', 50);
  });

  it('sendDeadlineReminderNotification отправляет напоминание только для настроенных дней', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await NotificationService.sendDeadlineReminderNotification('user-1', 'Test Goal', 3);

    expect(EmailService.sendDeadlineReminderNotification).toHaveBeenCalledWith(
      'user@example.com',
      'Test Goal',
      3,
    );
    expect(TelegramService.sendDeadlineReminder).toHaveBeenCalledWith('user-1', 'Test Goal', 3);
  });

  it('sendDeadlineReminderNotification не отправляет если день не в списке', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await NotificationService.sendDeadlineReminderNotification('user-1', 'Test Goal', 5);

    expect(EmailService.sendDeadlineReminderNotification).not.toHaveBeenCalled();
    expect(TelegramService.sendDeadlineReminder).not.toHaveBeenCalled();
  });

  it('getOrCreateNotificationPreferences создает preferences если их нет', async () => {
    vi.mocked(prisma.notificationPreferences.findUnique).mockResolvedValue(null);
    const createdPrefs = { id: 'prefs-1', userId: 'user-1' };
    vi.mocked(prisma.notificationPreferences.create).mockResolvedValue(createdPrefs as any);

    const result = await NotificationService.getOrCreateNotificationPreferences('user-1');

    expect(prisma.notificationPreferences.create).toHaveBeenCalledWith({
      data: { userId: 'user-1' },
    });
    expect(result).toEqual(createdPrefs);
  });

  it('getOrCreateNotificationPreferences возвращает существующие preferences', async () => {
    const existingPrefs = { id: 'prefs-1', userId: 'user-1' };
    vi.mocked(prisma.notificationPreferences.findUnique).mockResolvedValue(existingPrefs as any);

    const result = await NotificationService.getOrCreateNotificationPreferences('user-1');

    expect(prisma.notificationPreferences.create).not.toHaveBeenCalled();
    expect(result).toEqual(existingPrefs);
  });

  it('updateNotificationPreferences обновляет preferences', async () => {
    const existingPrefs = { id: 'prefs-1', userId: 'user-1' };
    vi.mocked(prisma.notificationPreferences.findUnique).mockResolvedValue(existingPrefs as any);
    const updatedPrefs = {
      id: 'prefs-1',
      userId: 'user-1',
      emailEnabled: false,
    };
    vi.mocked(prisma.notificationPreferences.update).mockResolvedValue(updatedPrefs as any);

    const result = await NotificationService.updateNotificationPreferences('user-1', {
      emailEnabled: false,
    });

    expect(prisma.notificationPreferences.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { emailEnabled: false },
    });
    expect(result).toEqual(updatedPrefs);
  });
});
