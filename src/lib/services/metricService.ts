import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { CreateMetricInput, UpdateMetricInput } from '../validations';

type MetricInclude = Prisma.MetricInclude;

const defaultMetricInclude: MetricInclude = {
  goal: true,
};

async function ensureGoalAccess(goalId: string, userId: string): Promise<void> {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, ownerId: userId },
  });

  if (!goal) {
    throw new Error('Goal not found');
  }
}

export class MetricService {
  static async listMetrics(goalId: string, userId: string) {
    // Проверяем доступ к цели
    await ensureGoalAccess(goalId, userId);

    return prisma.metric.findMany({
      where: { goalId },
      include: defaultMetricInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getMetric(id: string, userId: string) {
    const metric = await prisma.metric.findUnique({
      where: { id },
      include: defaultMetricInclude,
    });

    if (!metric) {
      throw new Error('Metric not found');
    }

    // Проверяем доступ к цели
    await ensureGoalAccess(metric.goalId, userId);

    return metric;
  }

  static async createMetric(data: CreateMetricInput, userId: string) {
    // Проверяем доступ к цели
    await ensureGoalAccess(data.goalId, userId);

    return prisma.metric.create({
      data: {
        name: data.name,
        currentValue: data.currentValue ?? 0,
        targetValue: data.targetValue,
        unit: data.unit,
        goalId: data.goalId,
      },
      include: defaultMetricInclude,
    });
  }

  static async updateMetric(id: string, data: UpdateMetricInput, userId: string) {
    const metric = await prisma.metric.findUnique({
      where: { id },
    });

    if (!metric) {
      throw new Error('Metric not found');
    }

    // Проверяем доступ к цели
    await ensureGoalAccess(metric.goalId, userId);

    return prisma.metric.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(typeof data.currentValue === 'number' && { currentValue: data.currentValue }),
        ...(typeof data.targetValue === 'number' && { targetValue: data.targetValue }),
        ...(data.unit && { unit: data.unit }),
      },
      include: defaultMetricInclude,
    });
  }

  static async deleteMetric(id: string, userId: string) {
    const metric = await prisma.metric.findUnique({
      where: { id },
    });

    if (!metric) {
      throw new Error('Metric not found');
    }

    // Проверяем доступ к цели
    await ensureGoalAccess(metric.goalId, userId);

    return prisma.metric.delete({
      where: { id },
    });
  }
}

