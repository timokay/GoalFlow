import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TelegramService } from '@/lib/services/telegramService';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  telegramId: '123456789',
};

vi.mock('@/lib/telegram/bot', () => ({
  bot: {
    api: {
      sendMessage: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('TelegramService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('sendMessage отправляет сообщение через bot API', async () => {
    const { bot } = await import('@/lib/telegram/bot');
    vi.mocked(bot.api.sendMessage).mockResolvedValue({ message_id: 1 } as any);

    const result = await TelegramService.sendMessage('123456789', 'Test message');

    expect(bot.api.sendMessage).toHaveBeenCalledWith('123456789', 'Test message', {
      parse_mode: 'Markdown',
    });
    expect(result).toBe(true);
  });

  it('sendDeadlineReminder отправляет напоминание о дедлайне', async () => {
    const { bot } = await import('@/lib/telegram/bot');
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(bot.api.sendMessage).mockResolvedValue({ message_id: 1 } as any);

    const result = await TelegramService.sendDeadlineReminder('user-1', 'Test Goal', 3);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { telegramId: true },
    });
    expect(bot.api.sendMessage).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('sendDeadlineReminder возвращает false если пользователь не найден', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await TelegramService.sendDeadlineReminder('user-1', 'Test Goal', 3);

    expect(result).toBe(false);
  });

  it('linkTelegramAccount привязывает Telegram ID к пользователю', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, telegramId: '123456789' } as any);

    const result = await TelegramService.linkTelegramAccount('user-1', '123456789');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { telegramId: '123456789' },
    });
    expect(result).toBe(true);
  });

  it('linkTelegramAccount возвращает false если Telegram ID уже привязан', async () => {
    const { prisma } = await import('@/lib/db');
    const otherUser = { ...mockUser, id: 'user-2' };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(otherUser as any);

    const result = await TelegramService.linkTelegramAccount('user-1', '123456789');

    expect(result).toBe(false);
  });
});
