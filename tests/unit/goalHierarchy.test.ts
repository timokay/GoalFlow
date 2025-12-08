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
  parentId: null,
  startDate: new Date(),
  endDate: new Date(Date.now() + 86400000),
  progress: 0,
};

const mockChildGoal = {
  ...mockGoal,
  id: 'goal-2',
  parentId: 'goal-1',
  type: 'MONTHLY',
};

vi.mock('@/lib/db', () => ({
  prisma: {
    goal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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

describe('GoalService - Hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createGoal создаёт цель с parentId', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'workspace-1' } as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.create).mockResolvedValue(mockChildGoal as any);

    const result = await GoalService.createGoal(
      {
        title: 'Child Goal',
        type: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        workspaceId: 'workspace-1',
        parentId: 'goal-1',
        status: undefined,
        progress: undefined,
      },
      'user-1',
    );

    expect(prisma.goal.findFirst).toHaveBeenCalledWith({
      where: { id: 'goal-1', ownerId: 'user-1' },
    });
    expect(prisma.goal.create).toHaveBeenCalled();
    expect(result.parentId).toBe('goal-1');
  });

  it('createGoal бросает ошибку если родитель не найден', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'workspace-1' } as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    await expect(
      GoalService.createGoal(
        {
          title: 'Child Goal',
          type: 'MONTHLY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          workspaceId: 'workspace-1',
          parentId: 'goal-unknown',
          status: undefined,
          progress: undefined,
        },
        'user-1',
      ),
    ).rejects.toThrow('Parent goal not found');
  });

  it('createGoal бросает ошибку если родитель - weekly goal', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'workspace-1' } as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue({
      ...mockGoal,
      type: 'WEEKLY',
    } as any);

    await expect(
      GoalService.createGoal(
        {
          title: 'Child Goal',
          type: 'MONTHLY',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          workspaceId: 'workspace-1',
          parentId: 'goal-1',
          status: undefined,
          progress: undefined,
        },
        'user-1',
      ),
    ).rejects.toThrow('Weekly goals cannot have child goals');
  });

  it('updateGoal бросает ошибку при циклической зависимости', async () => {
    const { prisma } = await import('@/lib/db');
    // Ситуация: goal-2 имеет parentId='goal-1'
    // Пытаемся установить goal-3 как родителя goal-2
    // Но goal-3 уже имеет родителя goal-2 (создаёт цикл: goal-2 -> goal-3 -> goal-2)
    const goalToUpdate = { ...mockChildGoal, id: 'goal-2', parentId: 'goal-1' };
    const newParent = { ...mockGoal, id: 'goal-3', parentId: 'goal-2' }; // goal-3 уже является потомком goal-2

    vi.mocked(prisma.goal.findFirst)
      .mockResolvedValueOnce(goalToUpdate as any) // Цель для обновления (goal-2)
      .mockResolvedValueOnce(newParent as any); // Новый родитель (goal-3)

    // При проверке циклической зависимости:
    // 1. Проверяем goal-3 (новый parentId) - он имеет parentId='goal-2'
    // 2. goal-2 === goalId (текущая цель), поэтому обнаруживаем цикл
    vi.mocked(prisma.goal.findUnique).mockResolvedValueOnce({
      parentId: 'goal-2', // goal-3 имеет родителя goal-2 (цикл!)
    } as any);

    await expect(
      GoalService.updateGoal('goal-2', { parentId: 'goal-3' }, 'user-1'),
    ).rejects.toThrow('Cannot set goal as its own parent');
  });

  it('updateGoal бросает ошибку если цель пытается стать своим родителем', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.findUnique).mockResolvedValue({ parentId: null } as any);

    await expect(
      GoalService.updateGoal('goal-1', { parentId: 'goal-1' }, 'user-1'),
    ).rejects.toThrow('Cannot set goal as its own parent');
  });

  it('getGoalHierarchy возвращает только корневые цели', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ id: 'workspace-1' } as any);
    vi.mocked(prisma.goal.findMany).mockResolvedValue([
      mockGoal,
      mockChildGoal,
      { ...mockGoal, id: 'goal-3', parentId: null },
    ] as any);

    const result = await GoalService.getGoalHierarchy('user-1', 'workspace-1');

    expect(result).toHaveLength(2);
    expect(result.every((goal) => !goal.parentId)).toBe(true);
  });

  it('updateParentProgress обновляет прогресс родителя', async () => {
    const { prisma } = await import('@/lib/db');
    const parentGoal = { ...mockGoal, id: 'parent-1', progress: 0 };
    const child1 = { ...mockChildGoal, id: 'child-1', progress: 50, parentId: 'parent-1' };
    const child2 = { ...mockChildGoal, id: 'child-2', progress: 70, parentId: 'parent-1' };

    vi.mocked(prisma.goal.findUnique)
      .mockResolvedValueOnce({
        ...parentGoal,
        children: [child1, child2],
      } as any)
      .mockResolvedValueOnce({ parentId: null } as any);

    vi.mocked(prisma.goal.update).mockResolvedValue({
      ...parentGoal,
      progress: 60, // (50 + 70) / 2 = 60
    } as any);

    await GoalService.updateParentProgress('parent-1');

    expect(prisma.goal.findUnique).toHaveBeenCalledWith({
      where: { id: 'parent-1' },
      include: { children: true },
    });
    expect(prisma.goal.update).toHaveBeenCalledWith({
      where: { id: 'parent-1' },
      data: { progress: 60 },
    });
  });

  it('updateParentProgress рекурсивно обновляет дедушку', async () => {
    const { prisma } = await import('@/lib/db');
    const grandParent = { ...mockGoal, id: 'grandparent-1', progress: 0 };
    const parent = { ...mockGoal, id: 'parent-1', progress: 0, parentId: 'grandparent-1' };
    const child = { ...mockChildGoal, id: 'child-1', progress: 50, parentId: 'parent-1' };

    // Первый вызов для parent-1
    vi.mocked(prisma.goal.findUnique)
      .mockResolvedValueOnce({
        ...parent,
        children: [child],
      } as any)
      .mockResolvedValueOnce({ parentId: 'grandparent-1' } as any); // parent-1 имеет родителя

    vi.mocked(prisma.goal.update).mockResolvedValueOnce({
      ...parent,
      progress: 50,
    } as any);

    // Второй вызов для grandparent-1 (рекурсивно)
    vi.mocked(prisma.goal.findUnique)
      .mockResolvedValueOnce({
        ...grandParent,
        children: [{ ...parent, progress: 50 }],
      } as any)
      .mockResolvedValueOnce({ parentId: null } as any); // grandparent-1 не имеет родителя

    vi.mocked(prisma.goal.update).mockResolvedValueOnce({
      ...grandParent,
      progress: 50,
    } as any);

    await GoalService.updateParentProgress('parent-1');

    expect(prisma.goal.update).toHaveBeenCalledTimes(2);
    expect(prisma.goal.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'parent-1' },
      data: { progress: 50 },
    });
    expect(prisma.goal.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'grandparent-1' },
      data: { progress: 50 },
    });
  });
});

