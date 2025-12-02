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

const mockGoalModel = {
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
};

vi.mock('@/lib/db', () => ({
  prisma: {
    goal: mockGoalModel,
  },
}));

describe('GoalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listGoals возвращает список целей пользователя', async () => {
    mockGoalModel.findMany.mockResolvedValue([mockGoal]);

    const result = await GoalService.listGoals('user-1', 'workspace-1');

    expect(mockGoalModel.findMany).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1', ownerId: 'user-1' },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([mockGoal]);
  });

  it('createGoal создаёт цель с ownerId', async () => {
    mockGoalModel.create.mockResolvedValue(mockGoal);

    const result = await GoalService.createGoal(
      {
        title: 'Test Goal',
        description: 'Desc',
        type: 'QUARTERLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        workspaceId: 'workspace-1',
      },
      'user-1',
    );

    expect(mockGoalModel.create).toHaveBeenCalled();
    expect(result).toEqual(mockGoal);
  });

  it('updateGoal бросает ошибку если цель не найдена', async () => {
    mockGoalModel.findFirst.mockResolvedValue(null);

    await expect(
      GoalService.updateGoal('goal-unknown', { title: 'Updated' }, 'user-1'),
    ).rejects.toThrow('Goal not found');
  });

  it('deleteGoal удаляет цель', async () => {
    mockGoalModel.findFirst.mockResolvedValue(mockGoal);
    mockGoalModel.delete.mockResolvedValue(mockGoal);

    await GoalService.deleteGoal('goal-1', 'user-1');

    expect(mockGoalModel.delete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
  });
});

