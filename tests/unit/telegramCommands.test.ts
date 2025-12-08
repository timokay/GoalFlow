import { describe, expect, it, beforeEach, vi } from 'vitest';
import { handleStartCommand } from '@/lib/telegram/commands/start';
import { handleHelpCommand } from '@/lib/telegram/commands/help';
import { handleLinkCommand } from '@/lib/telegram/commands/link';

const mockContext = {
  from: { id: 123456789, first_name: 'Test' },
  user: null,
  reply: vi.fn(),
};

describe('Telegram Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleStartCommand', () => {
    it('показывает приветствие для непривязанного пользователя', async () => {
      await handleStartCommand(mockContext as any);

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('Привет'),
      );
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('/link'),
      );
    });

    it('показывает приветствие для привязанного пользователя', async () => {
      const contextWithUser = {
        ...mockContext,
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      };

      await handleStartCommand(contextWithUser as any);

      expect(contextWithUser.reply).toHaveBeenCalledWith(
        expect.stringContaining('Привет'),
      );
      expect(contextWithUser.reply).toHaveBeenCalledWith(
        expect.stringContaining('/goals'),
      );
    });
  });

  describe('handleHelpCommand', () => {
    it('показывает справку по командам', async () => {
      await handleHelpCommand(mockContext as any);

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('Справка по командам'),
        { parse_mode: 'Markdown' },
      );
    });
  });

  describe('handleLinkCommand', () => {
    it('показывает инструкции для непривязанного пользователя', async () => {
      await handleLinkCommand(mockContext as any);

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('Привязка аккаунта'),
        { parse_mode: 'Markdown' },
      );
    });

    it('показывает информацию для уже привязанного пользователя', async () => {
      const contextWithUser = {
        ...mockContext,
        user: { id: 'user-1', email: 'test@example.com', telegramId: '123456789' },
      };

      await handleLinkCommand(contextWithUser as any);

      expect(contextWithUser.reply).toHaveBeenCalledWith(
        expect.stringContaining('уже привязан'),
      );
    });
  });
});

