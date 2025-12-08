import { prisma } from '../db';
import { GoalStatus, GoalType } from '@prisma/client';

export interface DashboardStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  pendingGoals: number;
  recentGoals: Array<{
    id: string;
    title: string;
    status: GoalStatus;
    progress: number;
    endDate: Date;
  }>;
}

export interface CompletionRateData {
  period: string;
  completed: number;
  total: number;
  rate: number;
}

export interface GoalTypeDistribution {
  type: GoalType;
  count: number;
  percentage: number;
}

export interface ProgressTrend {
  date: string;
  averageProgress: number;
  goalsCount: number;
}

export interface AnalyticsData {
  completionRate: CompletionRateData[];
  typeDistribution: GoalTypeDistribution[];
  progressTrend: ProgressTrend[];
  averageCompletionTime: number; // в днях
  onTimeCompletionRate: number; // процент целей завершённых вовремя
}

export class StatsService {
  static async getDashboardStats(userId: string, workspaceId: string): Promise<DashboardStats> {
    const [totalGoals, activeGoals, completedGoals, pendingGoals, recentGoals] = await Promise.all([
      prisma.goal.count({
        where: {
          ownerId: userId,
          workspaceId,
        },
      }),
      prisma.goal.count({
        where: {
          ownerId: userId,
          workspaceId,
          status: GoalStatus.ACTIVE,
        },
      }),
      prisma.goal.count({
        where: {
          ownerId: userId,
          workspaceId,
          status: GoalStatus.COMPLETED,
        },
      }),
      prisma.goal.count({
        where: {
          ownerId: userId,
          workspaceId,
          status: GoalStatus.REVIEW,
        },
      }),
      prisma.goal.findMany({
        where: {
          ownerId: userId,
          workspaceId,
        },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          endDate: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      pendingGoals,
      recentGoals,
    };
  }

  static async getAnalytics(
    userId: string,
    workspaceId: string,
    startDate?: Date,
    endDate?: Date,
    typeFilter?: GoalType,
  ): Promise<AnalyticsData> {
    const whereClause: any = {
      ownerId: userId,
      workspaceId,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    // Получаем все цели для анализа
    const allGoals = await prisma.goal.findMany({
      where: whereClause,
      select: {
        status: true,
        type: true,
        progress: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    // Completion rate по месяцам
    const completionRate: CompletionRateData[] = [];
    const monthlyData = new Map<string, { completed: number; total: number }>();

    allGoals.forEach((goal) => {
      const month = goal.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const current = monthlyData.get(month) || { completed: 0, total: 0 };
      current.total++;
      if (goal.status === GoalStatus.COMPLETED) {
        current.completed++;
      }
      monthlyData.set(month, current);
    });

    monthlyData.forEach((data, period) => {
      completionRate.push({
        period,
        completed: data.completed,
        total: data.total,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      });
    });

    completionRate.sort((a, b) => a.period.localeCompare(b.period));

    // Распределение по типам
    const typeCounts = new Map<GoalType, number>();
    allGoals.forEach((goal) => {
      typeCounts.set(goal.type, (typeCounts.get(goal.type) || 0) + 1);
    });

    const total = allGoals.length;
    const typeDistribution: GoalTypeDistribution[] = Array.from(typeCounts.entries()).map(
      ([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }),
    );

    // Тренд прогресса (по неделям)
    const progressTrend: ProgressTrend[] = [];
    const weeklyData = new Map<string, { totalProgress: number; count: number }>();

    allGoals.forEach((goal) => {
      const week = this.getWeekKey(goal.updatedAt);
      const current = weeklyData.get(week) || { totalProgress: 0, count: 0 };
      current.totalProgress += goal.progress;
      current.count++;
      weeklyData.set(week, current);
    });

    weeklyData.forEach((data, date) => {
      progressTrend.push({
        date,
        averageProgress: Math.round(data.totalProgress / data.count),
        goalsCount: data.count,
      });
    });

    progressTrend.sort((a, b) => a.date.localeCompare(b.date));

    // Среднее время выполнения завершённых целей
    const completedGoals = allGoals.filter((g) => g.status === GoalStatus.COMPLETED);
    let averageCompletionTime = 0;
    if (completedGoals.length > 0) {
      const totalDays = completedGoals.reduce((sum, goal) => {
        const days = Math.ceil(
          (goal.updatedAt.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return sum + days;
      }, 0);
      averageCompletionTime = Math.round(totalDays / completedGoals.length);
    }

    // Процент целей завершённых вовремя
    const onTimeCompleted = completedGoals.filter((goal) => {
      return goal.updatedAt <= goal.endDate;
    }).length;
    const onTimeCompletionRate =
      completedGoals.length > 0 ? Math.round((onTimeCompleted / completedGoals.length) * 100) : 0;

    return {
      completionRate,
      typeDistribution,
      progressTrend,
      averageCompletionTime,
      onTimeCompletionRate,
    };
  }

  private static getWeekKey(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const week = this.getWeekNumber(d);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  static async getTeamPerformanceMetrics(workspaceId: string, userId: string) {
    // Проверяем доступ к workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new Error('Workspace access denied');
    }

    // Получаем всех участников workspace
    const memberIds = [
      workspace.ownerId,
      ...workspace.members.map((m) => m.userId),
    ].filter((id, index, self) => self.indexOf(id) === index); // Убираем дубликаты

    // Получаем метрики для каждого участника
    const teamMetrics = await Promise.all(
      memberIds.map(async (memberId) => {
        const goals = await prisma.goal.findMany({
          where: {
            ownerId: memberId,
            workspaceId,
          },
          select: {
            id: true,
            status: true,
            progress: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            updatedAt: true,
            type: true,
          },
        });

        const totalGoals = goals.length;
        const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE).length;
        const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED).length;
        const averageProgress =
          goals.length > 0
            ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
            : 0;

        const completedGoalsData = goals.filter((g) => g.status === GoalStatus.COMPLETED);
        const onTimeCompleted = completedGoalsData.filter(
          (g) => g.updatedAt <= g.endDate,
        ).length;
        const onTimeRate =
          completedGoals > 0 ? Math.round((onTimeCompleted / completedGoals) * 100) : 0;

        const averageCompletionTime =
          completedGoalsData.length > 0
            ? Math.round(
                completedGoalsData.reduce((sum, goal) => {
                  const days = Math.ceil(
                    (goal.updatedAt.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24),
                  );
                  return sum + days;
                }, 0) / completedGoalsData.length,
              )
            : 0;

        const user =
          memberId === workspace.ownerId
            ? workspace.owner
            : workspace.members.find((m) => m.userId === memberId)?.user;

        return {
          userId: memberId,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
          totalGoals,
          activeGoals,
          completedGoals,
          averageProgress,
          onTimeCompletionRate: onTimeRate,
          averageCompletionTime,
        };
      }),
    );

    // Вычисляем общие метрики команды
    const totalTeamGoals = teamMetrics.reduce((sum, m) => sum + m.totalGoals, 0);
    const totalTeamCompleted = teamMetrics.reduce((sum, m) => sum + m.completedGoals, 0);
    const teamAverageProgress =
      teamMetrics.length > 0
        ? Math.round(teamMetrics.reduce((sum, m) => sum + m.averageProgress, 0) / teamMetrics.length)
        : 0;
    const teamOnTimeRate =
      totalTeamCompleted > 0
        ? Math.round(
            (teamMetrics.reduce((sum, m) => sum + (m.completedGoals * m.onTimeCompletionRate) / 100, 0) /
              totalTeamCompleted) *
              100,
          )
        : 0;

    return {
      teamMetrics,
      summary: {
        totalMembers: teamMetrics.length,
        totalGoals: totalTeamGoals,
        totalCompleted: totalTeamCompleted,
        averageProgress: teamAverageProgress,
        onTimeCompletionRate: teamOnTimeRate,
      },
    };
  }
}

