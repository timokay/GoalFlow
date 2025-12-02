import { GoalStatus, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { CreateGoalInput, UpdateGoalInput } from '../validations';

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

  static async getGoal(id: string, userId: string) {
    return prisma.goal.findFirst({
      where: { id, ownerId: userId },
      include: defaultGoalInclude,
    });
  }

  static async createGoal(data: CreateGoalInput, userId: string) {
    await ensureWorkspaceAccess(userId, data.workspaceId);

    return prisma.goal.create({
      data: {
        ...data,
        ownerId: userId,
      },
      include: defaultGoalInclude,
    });
  }

  static async updateGoal(id: string, data: UpdateGoalInput, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id, ownerId: userId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const payload: Prisma.GoalUpdateInput = {
      ...data,
    };

    if (data.status === GoalStatus.COMPLETED && typeof data.progress === 'undefined') {
      payload.progress = 100;
    }

    return prisma.goal.update({
      where: { id },
      data: payload,
      include: defaultGoalInclude,
    });
  }

  static async deleteGoal(id: string, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id, ownerId: userId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    return prisma.goal.delete({
      where: { id },
    });
  }
}

