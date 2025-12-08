import { prisma } from '../db';
import { WorkspaceRole } from '@prisma/client';
import { EmailService } from './emailService';
import { randomBytes } from 'crypto';

export interface CreateInviteInput {
  email: string;
  role: WorkspaceRole;
  workspaceId: string;
  invitedBy: string;
}

export class WorkspaceInviteService {
  private static generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  static async createInvite(data: CreateInviteInput) {
    // Проверяем доступ
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: data.workspaceId,
        OR: [
          { ownerId: data.invitedBy },
          {
            members: {
              some: {
                userId: data.invitedBy,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        ],
      },
    });

    if (!workspace) {
      throw new Error('Access denied');
    }

    // Проверяем, не приглашен ли уже пользователь
    const existingInvite = await prisma.workspaceInvite.findUnique({
      where: {
        email_workspaceId: {
          email: data.email,
          workspaceId: data.workspaceId,
        },
      },
    });

    if (existingInvite && !existingInvite.acceptedAt) {
      throw new Error('Invite already sent');
    }

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней на принятие

    const invite = await prisma.workspaceInvite.create({
      data: {
        email: data.email,
        role: data.role,
        workspaceId: data.workspaceId,
        invitedBy: data.invitedBy,
        token,
        expiresAt,
      },
      include: {
        workspace: true,
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Отправляем email приглашение
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${token}`;
    await EmailService.sendWorkspaceInvitation(
      data.email,
      workspace.name,
      invite.inviter.name || invite.inviter.email,
      inviteUrl,
    ).catch(console.error);

    return invite;
  }

  static async getInviteByToken(token: string) {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: true,
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.acceptedAt) {
      throw new Error('Invite already accepted');
    }

    if (new Date() > invite.expiresAt) {
      throw new Error('Invite expired');
    }

    return invite;
  }

  static async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token);

    // Проверяем, что email совпадает
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== invite.email) {
      throw new Error('Email mismatch');
    }

    // Проверяем, не является ли пользователь уже участником
    const existingMember = await prisma.workspaceUser.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (existingMember) {
      // Помечаем приглашение как принятое
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return { success: true, alreadyMember: true };
    }

    // Добавляем пользователя в workspace
    await prisma.$transaction([
      prisma.workspaceUser.create({
        data: {
          userId,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      }),
      prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return { success: true, alreadyMember: false };
  }

  static async cancelInvite(inviteId: string, userId: string) {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
      include: {
        workspace: true,
      },
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    // Проверяем права
    const isOwner = invite.workspace.ownerId === userId;
    const isInviter = invite.invitedBy === userId;

    if (!isOwner && !isInviter) {
      throw new Error('Access denied');
    }

    return prisma.workspaceInvite.delete({
      where: { id: inviteId },
    });
  }

  static async getWorkspaceInvites(workspaceId: string, userId: string) {
    // Проверяем доступ
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        ],
      },
    });

    if (!workspace) {
      throw new Error('Access denied');
    }

    return prisma.workspaceInvite.findMany({
      where: { workspaceId },
      include: {
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

