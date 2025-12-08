import { describe, expect, it, beforeEach, vi } from 'vitest';
import { EmailService } from '@/lib/services/emailService';

// Mock Resend
const mockSend = vi.fn();

vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  };
});

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'test@example.com';
  });

  it('sendEmail отправляет email через Resend', async () => {
    mockSend.mockResolvedValue({ id: 'email-123' });

    const result = await EmailService.sendEmail({
      to: 'user@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });

    expect(mockSend).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'user@example.com',
      subject: 'Test Subject',
      html: '<p>Test content</p>',
    });
    expect(result).toBe(true);
  });

  it('sendEmail возвращает false если RESEND_API_KEY не установлен', async () => {
    delete process.env.RESEND_API_KEY;

    const result = await EmailService.sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('sendGoalStatusChangeNotification отправляет уведомление об изменении статуса', async () => {
    mockSend.mockResolvedValue({ id: 'email-123' });

    const result = await EmailService.sendGoalStatusChangeNotification(
      'user@example.com',
      'Test Goal',
      'DRAFT',
      'ACTIVE',
    );

    expect(mockSend).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('sendProgressUpdateNotification отправляет уведомление об обновлении прогресса', async () => {
    mockSend.mockResolvedValue({ id: 'email-123' });

    const result = await EmailService.sendProgressUpdateNotification(
      'user@example.com',
      'Test Goal',
      75,
    );

    expect(mockSend).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('sendDeadlineReminderNotification отправляет напоминание о дедлайне', async () => {
    mockSend.mockResolvedValue({ id: 'email-123' });

    const result = await EmailService.sendDeadlineReminderNotification(
      'user@example.com',
      'Test Goal',
      3,
    );

    expect(mockSend).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('sendWorkspaceInvitation отправляет приглашение в workspace', async () => {
    mockSend.mockResolvedValue({ id: 'email-123' });

    const result = await EmailService.sendWorkspaceInvitation(
      'user@example.com',
      'Test Workspace',
      'John Doe',
      'https://example.com/invite/123',
    );

    expect(mockSend).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('sendEmail обрабатывает ошибки отправки', async () => {
    mockSend.mockRejectedValue(new Error('Send failed'));

    const result = await EmailService.sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result).toBe(false);
  });
});

