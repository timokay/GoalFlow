import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoalService } from '@/lib/services/goalService';
import { prisma } from '@/lib/db';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    workspace: {
      findFirst: vi.fn(),
    },
    goal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Goals Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserId = 'user-1';
  const mockWorkspaceId = 'workspace-1';

  it('should create, update, and complete a goal', async () => {
    // Mock workspace access
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: mockWorkspaceId,
    } as any);

    const mockGoal = {
      id: 'goal-1',
      title: 'Test Goal',
      description: 'Test Description',
      status: 'DRAFT',
      type: 'QUARTERLY',
      progress: 0,
      ownerId: mockUserId,
      workspaceId: mockWorkspaceId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: [],
      children: [],
      parent: null,
    };

    // Create goal
    vi.mocked(prisma.goal.create).mockResolvedValue(mockGoal as any);

    const created = await GoalService.createGoal(
      {
        title: 'Test Goal',
        description: 'Test Description',
        type: 'QUARTERLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        workspaceId: mockWorkspaceId,
        status: undefined,
        progress: undefined,
      },
      mockUserId,
    );

    expect(created).toBeDefined();
    expect(created.title).toBe('Test Goal');

    // Update goal progress
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({
      ...mockGoal,
      progress: 50,
    } as any);

    const updated = await GoalService.updateGoal(
      'goal-1',
      { progress: 50 },
      mockUserId,
    );

    expect(updated.progress).toBe(50);

    // Complete goal
    vi.mocked(prisma.goal.findFirst).mockResolvedValue({
      ...mockGoal,
      progress: 50,
    } as any);
    vi.mocked(prisma.goal.update).mockResolvedValue({
      ...mockGoal,
      status: 'COMPLETED',
      progress: 100,
    } as any);

    const completed = await GoalService.updateGoal(
      'goal-1',
      { status: 'COMPLETED' },
      mockUserId,
    );

    expect(completed.status).toBe('COMPLETED');
    expect(completed.progress).toBe(100);
  });

  it('should handle goal hierarchy correctly', async () => {
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue({
      id: mockWorkspaceId,
    } as any);

    const parentGoal = {
      id: 'parent-1',
      title: 'Parent Goal',
      type: 'QUARTERLY',
      ownerId: mockUserId,
      workspaceId: mockWorkspaceId,
      parentId: null,
    };

    const childGoal = {
      id: 'child-1',
      title: 'Child Goal',
      type: 'MONTHLY',
      ownerId: mockUserId,
      workspaceId: mockWorkspaceId,
      parentId: 'parent-1',
    };

    // Create parent
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.goal.create).mockResolvedValue(parentGoal as any);

    const parent = await GoalService.createGoal(
      {
        title: 'Parent Goal',
        type: 'QUARTERLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        workspaceId: mockWorkspaceId,
        status: undefined,
        progress: undefined,
      },
      mockUserId,
    );

    expect(parent.id).toBe('parent-1');

    // Create child
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(parentGoal as any);
    vi.mocked(prisma.goal.create).mockResolvedValue(childGoal as any);

    const child = await GoalService.createGoal(
      {
        title: 'Child Goal',
        type: 'MONTHLY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        workspaceId: mockWorkspaceId,
        parentId: 'parent-1',
        status: undefined,
        progress: undefined,
      },
      mockUserId,
    );

    expect(child.parentId).toBe('parent-1');
  });
});

