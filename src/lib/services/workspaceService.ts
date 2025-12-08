import { prisma } from '../db';
import { WorkspaceRole } from '@prisma/client';
import { CreateWorkspaceInput, UpdateWorkspaceInput } from '../validations';
import { ActivityService } from './activityService';

async function ensureWorkspaceAccess(
  userId: string,
  workspaceId: string,
  requiredRole?: WorkspaceRole,
): Promise<void> {
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
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!workspace) {
    throw new Error('Workspace access denied');
  }

  // Проверка роли, если требуется
  if (requiredRole) {
    const isOwner = workspace.ownerId === userId;
    const userRole = workspace.members[0]?.role;

    const roleHierarchy: Record<WorkspaceRole, number> = {
      VIEWER: 1,
      MEMBER: 2,
      ADMIN: 3,
      OWNER: 4,
    };

    const userRoleLevel = isOwner ? 4 : roleHierarchy[userRole || WorkspaceRole.VIEWER];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      throw new Error('Insufficient permissions');
    }
  }
}

export class WorkspaceService {
  static async getUserWorkspaces(userId: string) {
    return prisma.workspace.findMany({
      where: {
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
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            goals: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getDefaultWorkspace(userId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: {
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
      orderBy: { createdAt: 'asc' },
    });

    return workspace;
  }

  static async getWorkspace(id: string, userId: string) {
    await ensureWorkspaceAccess(userId, id);

    return prisma.workspace.findUnique({
      where: { id },
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
        _count: {
          select: {
            goals: true,
            members: true,
          },
        },
      },
    });
  }

  static async createWorkspace(data: CreateWorkspaceInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: userId,
        },
      });

      // Автоматически добавляем создателя как OWNER
      await tx.workspaceUser.create({
        data: {
          userId,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      // Создаем activity
      ActivityService.createActivity({
        type: 'WORKSPACE_CREATED',
        description: `Workspace "${workspace.name}" created`,
        userId,
        workspaceId: workspace.id,
      }).catch(console.error);

      return workspace;
    });
  }

  static async updateWorkspace(id: string, data: UpdateWorkspaceInput, userId: string) {
    await ensureWorkspaceAccess(userId, id, WorkspaceRole.ADMIN);

    return prisma.workspace.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  static async deleteWorkspace(id: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace || workspace.ownerId !== userId) {
      throw new Error('Only workspace owner can delete workspace');
    }

    return prisma.workspace.delete({
      where: { id },
    });
  }

  static async getWorkspaceMembers(workspaceId: string, userId: string) {
    await ensureWorkspaceAccess(userId, workspaceId);

    return prisma.workspaceUser.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async addWorkspaceMember(
    workspaceId: string,
    data: { email: string; role: WorkspaceRole },
    addedBy: string,
  ) {
    await ensureWorkspaceAccess(addedBy, workspaceId, WorkspaceRole.ADMIN);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Проверяем, не является ли пользователь уже участником
    const existingMember = await prisma.workspaceUser.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }

    const member = await prisma.workspaceUser.create({
      data: {
        userId: user.id,
        workspaceId,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Создаем activity
    ActivityService.createActivity({
      type: 'MEMBER_ADDED',
      description: `${member.user.name || member.user.email} added to workspace`,
      userId: addedBy,
      workspaceId,
      metadata: { memberId: member.id, role: data.role },
    }).catch(console.error);

    return member;
  }

  static async updateWorkspaceMemberRole(
    workspaceId: string,
    memberId: string,
    role: WorkspaceRole,
    updatedBy: string,
  ) {
    await ensureWorkspaceAccess(updatedBy, workspaceId, WorkspaceRole.ADMIN);

    const member = await prisma.workspaceUser.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new Error('Member not found');
    }

    // Нельзя изменить роль владельца workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (workspace?.ownerId === member.userId && role !== WorkspaceRole.OWNER) {
      throw new Error('Cannot change owner role');
    }

    return prisma.workspaceUser.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async removeWorkspaceMember(
    workspaceId: string,
    memberId: string,
    userId: string,
  ) {
    await ensureWorkspaceAccess(userId, workspaceId, WorkspaceRole.ADMIN);

    const memberToRemove = await prisma.workspaceUser.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!memberToRemove || memberToRemove.workspaceId !== workspaceId) {
      throw new Error('Member not found');
    }

    // Нельзя удалить владельца workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (workspace?.ownerId === memberToRemove.userId) {
      throw new Error('Cannot remove workspace owner');
    }

    const deleted = await prisma.workspaceUser.delete({
      where: { id: memberId },
    });

    // Создаем activity
    ActivityService.createActivity({
      type: 'MEMBER_REMOVED',
      description: `${memberToRemove.user.name || memberToRemove.user.email} removed from workspace`,
      userId: userId,
      workspaceId,
      metadata: { memberId: memberToRemove.id },
    }).catch(console.error);

    return deleted;
  }
}

