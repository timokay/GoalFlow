import { GoalStatus, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { CreateGoalInput, UpdateGoalInput } from '../validations';
import { NotificationService } from './notificationService';
import { ActivityService } from './activityService';

type GoalInclude = Prisma.GoalInclude;

const defaultGoalInclude: GoalInclude = {
  metrics: true,
  children: true,
  parent: true,
};

async function ensureWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    },
  });

  if (!workspace) {
    throw new Error('Workspace access denied');
  }
}

async function validateHierarchy(
  parentId: string | null | undefined,
  goalId: string | null,
  userId: string,
): Promise<void> {
  if (!parentId) {
    return;
  }

  // Проверяем, что родитель существует и принадлежит пользователю
  const parent = await prisma.goal.findFirst({
    where: { id: parentId, ownerId: userId },
  });

  if (!parent) {
    throw new Error('Parent goal not found');
  }

  // Проверяем на циклические зависимости
  if (goalId) {
    let currentParentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new Error('Circular dependency detected');
      }
      if (currentParentId === goalId) {
        throw new Error('Cannot set goal as its own parent');
      }

      visited.add(currentParentId);

      const currentParent: { parentId: string | null } | null = await prisma.goal.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      currentParentId = currentParent?.parentId || null;
    }
  }

  // Проверяем тип родителя (weekly goals не могут быть родителями)
  if (parent.type === 'WEEKLY') {
    throw new Error('Weekly goals cannot have child goals');
  }
}

export class GoalService {
  static async listGoals(userId: string, workspaceId: string) {
    await ensureWorkspaceAccess(userId, workspaceId);

    return prisma.goal.findMany({
      where: {
        workspaceId,
        ownerId: userId,
      },
      include: defaultGoalInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getGoalHierarchy(userId: string, workspaceId: string) {
    await ensureWorkspaceAccess(userId, workspaceId);

    // Получаем все цели пользователя в workspace
    const allGoals = await prisma.goal.findMany({
      where: {
        workspaceId,
        ownerId: userId,
      },
      include: {
        ...defaultGoalInclude,
        children: {
          include: {
            children: {
              include: {
                children: true, // Поддержка до 3 уровней вложенности
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Фильтруем только корневые цели (без parentId)
    return allGoals.filter((goal) => !goal.parentId);
  }

  static async getGoal(id: string, userId: string) {
    return prisma.goal.findFirst({
      where: { id, ownerId: userId },
      include: defaultGoalInclude,
    });
  }

  static async createGoal(data: CreateGoalInput, userId: string) {
    await ensureWorkspaceAccess(userId, data.workspaceId);
    await validateHierarchy(data.parentId, null, userId);

    const goal = await prisma.goal.create({
      data: {
        ...data,
        ownerId: userId,
      },
      include: defaultGoalInclude,
    });

    // Создаем activity
    ActivityService.createActivity({
      type: 'GOAL_CREATED',
      description: `Goal "${goal.title}" created`,
      userId,
      workspaceId: data.workspaceId,
      goalId: goal.id,
    }).catch(console.error);

    return goal;
  }

  static async updateGoal(id: string, data: UpdateGoalInput, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id, ownerId: userId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    await ensureWorkspaceAccess(userId, goal.workspaceId);

    // Валидация иерархии если parentId изменяется
    if (data.parentId !== undefined) {
      await validateHierarchy(data.parentId, id, userId);
    }

    const oldStatus = goal.status;
    const payload: Prisma.GoalUpdateInput = {
      ...data,
    };

    if (data.status === GoalStatus.COMPLETED && typeof data.progress === 'undefined') {
      payload.progress = 100;
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: payload,
      include: defaultGoalInclude,
    });

    // Обновляем прогресс родителя если изменился прогресс
    if (typeof data.progress === 'number' && data.progress !== goal.progress && goal.parentId) {
      await this.updateParentProgress(goal.parentId).catch(console.error);
    }

          // Отправляем уведомления через unified notification service
          if (data.status && data.status !== oldStatus) {
            NotificationService.sendStatusChangeNotification(
              userId,
              updatedGoal.title,
              oldStatus,
              data.status,
            ).catch(console.error);

            // Создаем activity для изменения статуса
            ActivityService.createActivity({
              type: 'GOAL_UPDATED',
              description: `Goal "${updatedGoal.title}" status changed from ${oldStatus} to ${data.status}`,
              userId,
              workspaceId: updatedGoal.workspaceId,
              goalId: updatedGoal.id,
              metadata: { oldStatus, newStatus: data.status },
            }).catch(console.error);
          }

          if (typeof data.progress === 'number' && data.progress !== goal.progress) {
            NotificationService.sendProgressUpdateNotification(
              userId,
              updatedGoal.title,
              data.progress,
            ).catch(console.error);

            // Создаем activity для обновления прогресса
            ActivityService.createActivity({
              type: 'METRIC_UPDATED',
              description: `Goal "${updatedGoal.title}" progress updated to ${data.progress}%`,
              userId,
              workspaceId: updatedGoal.workspaceId,
              goalId: updatedGoal.id,
              metadata: { progress: data.progress },
            }).catch(console.error);
          }

          if (data.status === GoalStatus.COMPLETED && oldStatus !== GoalStatus.COMPLETED) {
            ActivityService.createActivity({
              type: 'GOAL_COMPLETED',
              description: `Goal "${updatedGoal.title}" completed`,
              userId,
              workspaceId: updatedGoal.workspaceId,
              goalId: updatedGoal.id,
            }).catch(console.error);
          }

    return updatedGoal;
  }

  static async updateParentProgress(parentId: string): Promise<void> {
    const parent = await prisma.goal.findUnique({
      where: { id: parentId },
      include: { children: true },
    });

    if (!parent || parent.children.length === 0) {
      return;
    }

    // Вычисляем средний прогресс всех дочерних целей
    const totalProgress = parent.children.reduce((sum, child) => sum + child.progress, 0);
    const averageProgress = Math.round(totalProgress / parent.children.length);

    await prisma.goal.update({
      where: { id: parentId },
      data: { progress: averageProgress },
    });

    // Рекурсивно обновляем родителя родителя
    const grandParent = await prisma.goal.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });

    if (grandParent?.parentId) {
      await this.updateParentProgress(grandParent.parentId);
    }
  }

  static async deleteGoal(id: string, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id, ownerId: userId },
      include: defaultGoalInclude,
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Создаем activity перед удалением
    ActivityService.createActivity({
      type: 'GOAL_DELETED',
      description: `Goal "${goal.title}" deleted`,
      userId,
      workspaceId: goal.workspaceId,
      goalId: goal.id,
    }).catch(console.error);

    return prisma.goal.delete({
      where: { id },
    });
  }
}

