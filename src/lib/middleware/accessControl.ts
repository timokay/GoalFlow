import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WorkspaceRole } from '@prisma/client';

export interface AccessControlOptions {
  requiredRole?: WorkspaceRole;
  allowOwner?: boolean;
}

/**
 * Middleware для проверки доступа к workspace
 */
export async function checkWorkspaceAccess(
  userId: string,
  workspaceId: string,
  options: AccessControlOptions = {},
): Promise<{ allowed: boolean; role?: WorkspaceRole; isOwner: boolean }> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!workspace) {
    return { allowed: false, isOwner: false };
  }

  const isOwner = workspace.ownerId === userId;
  const member = workspace.members[0];
  const userRole = isOwner ? WorkspaceRole.OWNER : member?.role;

  // Если пользователь владелец и allowOwner = true, разрешаем доступ
  if (isOwner && (options.allowOwner !== false)) {
    return { allowed: true, role: WorkspaceRole.OWNER, isOwner: true };
  }

  // Если требуется определенная роль
  if (options.requiredRole && userRole) {
    const roleHierarchy: Record<WorkspaceRole, number> = {
      VIEWER: 1,
      MEMBER: 2,
      ADMIN: 3,
      OWNER: 4,
    };

    const userRoleLevel = roleHierarchy[userRole];
    const requiredRoleLevel = roleHierarchy[options.requiredRole];

    if (userRoleLevel >= requiredRoleLevel) {
      return { allowed: true, role: userRole, isOwner };
    }
  }

  // Если роль не указана, проверяем базовый доступ
  if (!options.requiredRole && (isOwner || member)) {
    return { allowed: true, role: userRole, isOwner };
  }

  return { allowed: false, role: userRole, isOwner };
}

/**
 * Middleware wrapper для API routes
 */
export function withAccessControl(
  handler: (req: Request, context: any, access: { userId: string; workspaceId: string; role?: WorkspaceRole; isOwner: boolean }) => Promise<Response>,
  options: AccessControlOptions = {},
) {
  return async (req: Request, context: any) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || req.headers.get('x-workspace-id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const access = await checkWorkspaceAccess(session.user.id, workspaceId, options);

    if (!access.allowed) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return handler(req, context, {
      userId: session.user.id,
      workspaceId,
      role: access.role,
      isOwner: access.isOwner,
    });
  };
}

