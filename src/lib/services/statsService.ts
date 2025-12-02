import { prisma } from '../db';
import { GoalStatus } from '@prisma/client';

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
}

