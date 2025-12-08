import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceService } from '@/lib/services/workspaceService';
import { prisma } from '@/lib/db';
import { WorkspaceRole } from '@prisma/client';

vi.mock('@/lib/db', () => ({
  prisma: {
    workspace: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceUser: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Workspace Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserId = 'user-1';
  const mockWorkspaceId = 'workspace-1';

  it('should create workspace and add members', async () => {
    const mockWorkspace = {
      id: mockWorkspaceId,
      name: 'Test Workspace',
      description: 'Test Description',
      ownerId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create workspace
    vi.mocked(prisma.workspace.create).mockResolvedValue(mockWorkspace as any);
    vi.mocked(prisma.workspaceUser.create).mockResolvedValue({
      id: 'wum-1',
      userId: mockUserId,
      workspaceId: mockWorkspaceId,
      role: WorkspaceRole.OWNER,
    } as any);

    const workspace = await WorkspaceService.createWorkspace(
      {
        name: 'Test Workspace',
        description: 'Test Description',
      },
      mockUserId,
    );

    expect(workspace.name).toBe('Test Workspace');

    // Add member
    vi.mocked(prisma.workspace.findFirst).mockResolvedValue(mockWorkspace as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-2',
      email: 'member@example.com',
    } as any);
    vi.mocked(prisma.workspaceUser.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.workspaceUser.create).mockResolvedValue({
      id: 'wum-2',
      userId: 'user-2',
      workspaceId: mockWorkspaceId,
      role: WorkspaceRole.MEMBER,
    } as any);

    const member = await WorkspaceService.addWorkspaceMember(
      mockWorkspaceId,
      'member@example.com',
      WorkspaceRole.MEMBER,
      mockUserId,
    );

    expect(member.userId).toBe('user-2');
    expect(member.role).toBe(WorkspaceRole.MEMBER);
  });

  it('should enforce RBAC correctly', async () => {
    const mockWorkspace = {
      id: mockWorkspaceId,
      ownerId: 'owner-1',
      members: [
        {
          userId: 'admin-1',
          role: WorkspaceRole.ADMIN,
        },
        {
          userId: 'member-1',
          role: WorkspaceRole.MEMBER,
        },
      ],
    };

    // Owner should have all permissions
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      ...mockWorkspace,
      ownerId: 'owner-1',
      members: [{ userId: 'owner-1', role: WorkspaceRole.OWNER }],
    } as any);

    await expect(
      WorkspaceService.ensureWorkspaceAccess('owner-1', mockWorkspaceId, WorkspaceRole.OWNER),
    ).resolves.toBeUndefined();

    // Admin should have admin permissions
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      ...mockWorkspace,
      members: [{ userId: 'admin-1', role: WorkspaceRole.ADMIN }],
    } as any);

    await expect(
      WorkspaceService.ensureWorkspaceAccess('admin-1', mockWorkspaceId, WorkspaceRole.ADMIN),
    ).resolves.toBeUndefined();

    // Member should not have admin permissions
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
      ...mockWorkspace,
      members: [{ userId: 'member-1', role: WorkspaceRole.MEMBER }],
    } as any);

    await expect(
      WorkspaceService.ensureWorkspaceAccess('member-1', mockWorkspaceId, WorkspaceRole.ADMIN),
    ).rejects.toThrow();
  });
});

