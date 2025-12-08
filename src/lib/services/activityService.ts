import { prisma } from '../db';

export type ActivityType =
  | 'GOAL_CREATED'
  | 'GOAL_UPDATED'
  | 'GOAL_COMPLETED'
  | 'GOAL_CANCELLED'
  | 'GOAL_DELETED'
  | 'METRIC_UPDATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_UPDATED';

export interface CreateActivityInput {
  type: ActivityType;
  description: string;
  userId: string;
  workspaceId: string;
  goalId?: string;
  metadata?: Record<string, any>;
}

export class ActivityService {
  static async createActivity(data: CreateActivityInput) {
    return prisma.activity.create({
      data: {
        type: data.type,
        description: data.description,
        userId: data.userId,
        workspaceId: data.workspaceId,
        goalId: data.goalId,
        metadata: data.metadata || {},
      },
    });
  }

  static async getWorkspaceActivities(workspaceId: string, userId: string, limit: number = 50) {
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
    });

    if (!workspace) {
      throw new Error('Workspace access denied');
    }

    return prisma.activity.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        goal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async getUserActivities(userId: string, limit: number = 50) {
    return prisma.activity.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        goal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

