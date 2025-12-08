import { describe, expect, it, beforeEach, vi } from 'vitest';
import { GoalService } from '@/lib/services/goalService';

const mockGoal = {
  id: 'goal-1',
  title: 'Test Goal',
  description: 'Desc',
  status: 'DRAFT',
  type: 'QUARTERLY',
  ownerId: 'user-1',
  workspaceId: 'workspace-1',
  startDate: new Date(),
  endDate: new Date(Date.now() + 86400000),
  progress: 0,
};

vi.mock('@/lib/db', () => ({
  prisma: {
    goal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    workspace: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/services/telegramService', () => ({
  TelegramService: {
    sendStatusChangeNotification: vi.fn(),
    sendProgressUpdate: vi.fn(),
  },
}));

describe('GoalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listGoals возвращает список целей пользователя', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'workspace-1' } as any);
    vi.mocked(prisma.goal.findMany).mockResolvedValue([mockGoal] as any);

    const result = await GoalService.listGoals('user-1', 'workspace-1');

    expect(prisma.workspace.findFirst).toHaveBeenCalled();
    expect(prisma.goal.findMany).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1', ownerId: 'user-1' },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([mockGoal]);
  });

  it('createGoal создаёт цель с ownerId', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'workspace-1' } as any);
    vi.mocked(prisma.goal.create).mockResolvedValue(mockGoal as any);

    const result = await GoalService.createGoal(
      {
        title: 'Test Goal',
        description: 'Desc',
        type: 'QUARTERLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        workspaceId: 'workspace-1',
        status: undefined,
        progress: undefined,
      },
      'user-1',
    );

    expect(prisma.workspace.findFirst).toHaveBeenCalled();
    expect(prisma.goal.create).toHaveBeenCalled();
    expect(result).toEqual(mockGoal);
  });

  it('updateGoal бросает ошибку если цель не найдена', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    await expect(
      GoalService.updateGoal('goal-unknown', { title: 'Updated' }, 'user-1'),
    ).rejects.toThrow('Goal not found');
  });

  it('deleteGoal удаляет цель', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.delete).mockResolvedValue(mockGoal as any);

    await GoalService.deleteGoal('goal-1', 'user-1');

    expect(prisma.goal.findFirst).toHaveBeenCalled();
    expect(prisma.goal.delete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });
});
