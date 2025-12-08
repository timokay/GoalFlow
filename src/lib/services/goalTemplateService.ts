import { prisma } from '../db';
import { GoalType } from '@prisma/client';

export interface CreateGoalTemplateInput {
  name: string;
  description?: string;
  type: GoalType;
  title: string;
  defaultDescription?: string;
  workspaceId?: string;
  isPublic?: boolean;
}

export interface UpdateGoalTemplateInput {
  name?: string;
  description?: string;
  type?: GoalType;
  title?: string;
  defaultDescription?: string;
  isPublic?: boolean;
}

export class GoalTemplateService {
  static async getUserTemplates(userId: string, workspaceId?: string) {
    return prisma.goalTemplate.findMany({
      where: {
        ownerId: userId,
        OR: [
          { workspaceId: workspaceId || null },
          { isPublic: true },
          { workspaceId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getTemplate(id: string, userId: string) {
    const template = await prisma.goalTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Проверяем доступ: владелец, публичный или workspace member
    if (template.ownerId !== userId && !template.isPublic) {
      if (template.workspaceId) {
        const workspace = await prisma.workspace.findFirst({
          where: {
            id: template.workspaceId,
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
          throw new Error('Access denied');
        }
      } else {
        throw new Error('Access denied');
      }
    }

    return template;
  }

  static async createTemplate(data: CreateGoalTemplateInput, userId: string) {
    if (data.workspaceId) {
      // Проверяем доступ к workspace
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: data.workspaceId,
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
    }

    return prisma.goalTemplate.create({
      data: {
        ...data,
        ownerId: userId,
        isPublic: data.isPublic || false,
      },
    });
  }

  static async updateTemplate(id: string, data: UpdateGoalTemplateInput, userId: string) {
    const template = await prisma.goalTemplate.findUnique({
      where: { id },
    });

    if (!template || template.ownerId !== userId) {
      throw new Error('Template not found or access denied');
    }

    return prisma.goalTemplate.update({
      where: { id },
      data,
    });
  }

  static async deleteTemplate(id: string, userId: string) {
    const template = await prisma.goalTemplate.findUnique({
      where: { id },
    });

    if (!template || template.ownerId !== userId) {
      throw new Error('Template not found or access denied');
    }

    return prisma.goalTemplate.delete({
      where: { id },
    });
  }

  static async createGoalFromTemplate(templateId: string, userId: string, workspaceId: string) {
    const template = await this.getTemplate(templateId, userId);

    // Импортируем GoalService для создания цели
    const { GoalService } = await import('./goalService');

    const today = new Date();
    let endDate = new Date(today);

    // Вычисляем дату окончания в зависимости от типа
    switch (template.type) {
      case 'WEEKLY':
        endDate.setDate(today.getDate() + 7);
        break;
      case 'MONTHLY':
        endDate.setMonth(today.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(today.getMonth() + 3);
        break;
    }

    return GoalService.createGoal(
      {
        title: template.title,
        description: template.defaultDescription || template.description || undefined,
        type: template.type,
        startDate: today,
        endDate,
        workspaceId,
        status: undefined,
        progress: undefined,
      },
      userId,
    );
  }
}
