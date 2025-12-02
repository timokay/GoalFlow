import { prisma } from '../db';

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
}

