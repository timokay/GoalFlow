import { prisma } from '../db';
import { GoalStatus, GoalType } from '@prisma/client';

export interface ReportConfig {
  workspaceId: string;
  userId: string;
  startDate?: Date;
  endDate?: Date;
  statusFilter?: GoalStatus[];
  typeFilter?: GoalType[];
  includeMetrics?: boolean;
  includeActivities?: boolean;
  groupBy?: 'user' | 'type' | 'status' | 'month';
}

export interface ReportData {
  summary: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    averageProgress: number;
    completionRate: number;
  };
  goals: Array<{
    id: string;
    title: string;
    status: GoalStatus;
    type: GoalType;
    progress: number;
    startDate: Date;
    endDate: Date;
    owner: {
      name: string | null;
      email: string;
    };
    metrics?: Array<{
      name: string;
      currentValue: number;
      targetValue: number;
      unit: string;
    }>;
  }>;
  groupedData?: Record<string, any>;
}

export class ReportService {
  static async generateReport(config: ReportConfig): Promise<ReportData> {
    // Проверяем доступ к workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: config.workspaceId,
        OR: [
          { ownerId: config.userId },
          {
            members: {
              some: { userId: config.userId },
            },
          },
        ],
      },
    });

    if (!workspace) {
      throw new Error('Workspace access denied');
    }

    // Строим where clause
    const whereClause: any = {
      workspaceId: config.workspaceId,
    };

    if (config.startDate || config.endDate) {
      whereClause.createdAt = {};
      if (config.startDate) whereClause.createdAt.gte = config.startDate;
      if (config.endDate) whereClause.createdAt.lte = config.endDate;
    }

    if (config.statusFilter && config.statusFilter.length > 0) {
      whereClause.status = { in: config.statusFilter };
    }

    if (config.typeFilter && config.typeFilter.length > 0) {
      whereClause.type = { in: config.typeFilter };
    }

    // Получаем цели
    const goals = await prisma.goal.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        metrics: config.includeMetrics || false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Вычисляем summary
    const totalGoals = goals.length;
    const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE).length;
    const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED).length;
    const averageProgress =
      goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0;
    const completionRate =
      totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // Формируем данные для группировки
    let groupedData: Record<string, any> | undefined;
    if (config.groupBy) {
      groupedData = this.groupGoals(goals, config.groupBy);
    }

    return {
      summary: {
        totalGoals,
        activeGoals,
        completedGoals,
        averageProgress,
        completionRate,
      },
      goals: goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        status: goal.status,
        type: goal.type,
        progress: goal.progress,
        startDate: goal.startDate,
        endDate: goal.endDate,
        owner: {
          name: goal.owner.name,
          email: goal.owner.email,
        },
        metrics: config.includeMetrics
          ? goal.metrics?.map((m) => ({
              name: m.name,
              currentValue: m.currentValue,
              targetValue: m.targetValue,
              unit: m.unit,
            }))
          : undefined,
      })),
      groupedData,
    };
  }

  private static groupGoals(
    goals: any[],
    groupBy: 'user' | 'type' | 'status' | 'month',
  ): Record<string, any> {
    const grouped: Record<string, any> = {};

    goals.forEach((goal) => {
      let key: string;

      switch (groupBy) {
        case 'user':
          key = goal.owner.email;
          break;
        case 'type':
          key = goal.type;
          break;
        case 'status':
          key = goal.status;
          break;
        case 'month':
          key = goal.createdAt.toISOString().substring(0, 7); // YYYY-MM
          break;
        default:
          key = 'unknown';
      }

      if (!grouped[key]) {
        grouped[key] = {
          count: 0,
          totalProgress: 0,
          completed: 0,
          goals: [],
        };
      }

      grouped[key].count++;
      grouped[key].totalProgress += goal.progress;
      if (goal.status === GoalStatus.COMPLETED) {
        grouped[key].completed++;
      }
      grouped[key].goals.push({
        id: goal.id,
        title: goal.title,
        status: goal.status,
        progress: goal.progress,
      });
    });

    // Вычисляем средние значения
    Object.keys(grouped).forEach((key) => {
      const group = grouped[key];
      group.averageProgress = Math.round(group.totalProgress / group.count);
      group.completionRate =
        group.count > 0 ? Math.round((group.completed / group.count) * 100) : 0;
    });

    return grouped;
  }
}

