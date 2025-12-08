import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MetricService } from '@/lib/services/metricService';

const mockMetric = {
  id: 'metric-1',
  name: 'Test Metric',
  currentValue: 50,
  targetValue: 100,
  unit: 'units',
  goalId: 'goal-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGoal = {
  id: 'goal-1',
  title: 'Test Goal',
  ownerId: 'user-1',
  workspaceId: 'workspace-1',
};

vi.mock('@/lib/db', () => ({
  prisma: {
    metric: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    goal: {
      findFirst: vi.fn(),
    },
  },
}));

describe('MetricService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listMetrics возвращает список метрик цели', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.metric.findMany).mockResolvedValue([mockMetric] as any);

    const result = await MetricService.listMetrics('goal-1', 'user-1');

    expect(prisma.goal.findFirst).toHaveBeenCalledWith({
      where: { id: 'goal-1', ownerId: 'user-1' },
    });
    expect(prisma.metric.findMany).toHaveBeenCalledWith({
      where: { goalId: 'goal-1' },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([mockMetric]);
  });

  it('listMetrics бросает ошибку если цель не найдена', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(null);

    await expect(MetricService.listMetrics('goal-unknown', 'user-1')).rejects.toThrow(
      'Goal not found',
    );
  });

  it('getMetric возвращает метрику', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.metric.findUnique).mockResolvedValue(mockMetric as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);

    const result = await MetricService.getMetric('metric-1', 'user-1');

    expect(prisma.metric.findUnique).toHaveBeenCalledWith({
      where: { id: 'metric-1' },
      include: expect.any(Object),
    });
    expect(result).toEqual(mockMetric);
  });

  it('getMetric бросает ошибку если метрика не найдена', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.metric.findUnique).mockResolvedValue(null);

    await expect(MetricService.getMetric('metric-unknown', 'user-1')).rejects.toThrow(
      'Metric not found',
    );
  });

  it('createMetric создаёт метрику', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.metric.create).mockResolvedValue(mockMetric as any);

    const result = await MetricService.createMetric(
      {
        name: 'Test Metric',
        currentValue: 50,
        targetValue: 100,
        unit: 'units',
        goalId: 'goal-1',
      },
      'user-1',
    );

    expect(prisma.goal.findFirst).toHaveBeenCalledWith({
      where: { id: 'goal-1', ownerId: 'user-1' },
    });
    expect(prisma.metric.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Metric',
        currentValue: 50,
        targetValue: 100,
        unit: 'units',
        goalId: 'goal-1',
      },
      include: expect.any(Object),
    });
    expect(result).toEqual(mockMetric);
  });

  it('createMetric использует currentValue = 0 по умолчанию', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.metric.create).mockResolvedValue({
      ...mockMetric,
      currentValue: 0,
    } as any);

    await MetricService.createMetric(
      {
        name: 'Test Metric',
        targetValue: 100,
        unit: 'units',
        goalId: 'goal-1',
      },
      'user-1',
    );

    expect(prisma.metric.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Metric',
        currentValue: 0,
        targetValue: 100,
        unit: 'units',
        goalId: 'goal-1',
      },
      include: expect.any(Object),
    });
  });

  it('updateMetric обновляет метрику', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.metric.findUnique).mockResolvedValue(mockMetric as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.metric.update).mockResolvedValue({
      ...mockMetric,
      currentValue: 75,
    } as any);

    const result = await MetricService.updateMetric(
      'metric-1',
      { currentValue: 75 },
      'user-1',
    );

    expect(prisma.metric.update).toHaveBeenCalledWith({
      where: { id: 'metric-1' },
      data: {
        currentValue: 75,
      },
      include: expect.any(Object),
    });
    expect(result.currentValue).toBe(75);
  });

  it('updateMetric бросает ошибку если метрика не найдена', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.metric.findUnique).mockResolvedValue(null);

    await expect(
      MetricService.updateMetric('metric-unknown', { currentValue: 75 }, 'user-1'),
    ).rejects.toThrow('Metric not found');
  });

  it('deleteMetric удаляет метрику', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.metric.findUnique).mockResolvedValue(mockMetric as any);
    vi.mocked(prisma.goal.findFirst).mockResolvedValue(mockGoal as any);
    vi.mocked(prisma.metric.delete).mockResolvedValue(mockMetric as any);

    await MetricService.deleteMetric('metric-1', 'user-1');

    expect(prisma.metric.delete).toHaveBeenCalledWith({
      where: { id: 'metric-1' },
    });
  });

  it('deleteMetric бросает ошибку если метрика не найдена', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.metric.findUnique).mockResolvedValue(null);

    await expect(MetricService.deleteMetric('metric-unknown', 'user-1')).rejects.toThrow(
      'Metric not found',
    );
  });
});

