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

  /**
   * Рассчитывает прогресс цели на основе метрик
   * Прогресс = средний процент выполнения всех метрик
   */
  static async calculateGoalProgress(goalId: string): Promise<number> {
    const metrics = await prisma.metric.findMany({
      where: { goalId },
      select: {
        currentValue: true,
        targetValue: true,
      },
    });

    if (metrics.length === 0) {
      return 0;
    }

    // Рассчитываем процент для каждой метрики
    const percentages = metrics.map((metric) => {
      if (metric.targetValue === 0) return 0;
      const percentage = (metric.currentValue / metric.targetValue) * 100;
      // Ограничиваем максимум 100%
      return Math.min(percentage, 100);
    });

    // Возвращаем средний процент
    const averageProgress = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    return Math.round(averageProgress);
  }

  /**
   * Обновляет прогресс цели на основе метрик
   */
  static async updateGoalProgressFromMetrics(goalId: string): Promise<void> {
    const progress = await this.calculateGoalProgress(goalId);

    await prisma.goal.update({
      where: { id: goalId },
      data: { progress },
    });

    // Обновляем прогресс родительских целей, если есть
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { parentId: true },
    });

    if (goal?.parentId) {
      // Импортируем GoalService для обновления родителя
      const { GoalService } = await import('./goalService');
      await GoalService.updateParentProgress(goal.parentId).catch(console.error);
    }
  }

  static async createMetric(data: CreateMetricInput, userId: string) {
    // Проверяем доступ к цели
    await ensureGoalAccess(data.goalId, userId);

    const metric = await prisma.metric.create({
      data: {
        name: data.name,
        currentValue: data.currentValue ?? 0,
        targetValue: data.targetValue,
        unit: data.unit,
        goalId: data.goalId,
      },
      include: defaultMetricInclude,
    });

    // Пересчитываем прогресс цели
    await this.updateGoalProgressFromMetrics(data.goalId).catch(console.error);

    return metric;
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

    const updatedMetric = await prisma.metric.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(typeof data.currentValue === 'number' && { currentValue: data.currentValue }),
        ...(typeof data.targetValue === 'number' && { targetValue: data.targetValue }),
        ...(data.unit && { unit: data.unit }),
      },
      include: defaultMetricInclude,
    });

    // Пересчитываем прогресс цели
    await this.updateGoalProgressFromMetrics(metric.goalId).catch(console.error);

    return updatedMetric;
  }

  static async deleteMetric(id: string, userId: string) {
    const metric = await prisma.metric.findUnique({
      where: { id },
    });

    if (!metric) {
      throw new Error('Metric not found');
    }

    const goalId = metric.goalId;
    // Проверяем доступ к цели
    await ensureGoalAccess(goalId, userId);

    await prisma.metric.delete({
      where: { id },
    });

    // Пересчитываем прогресс цели после удаления метрики
    await this.updateGoalProgressFromMetrics(goalId).catch(console.error);
  }
}
