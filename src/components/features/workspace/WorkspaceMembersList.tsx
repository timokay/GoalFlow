'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceRole } from '@prisma/client';
import { Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface WorkspaceMembersListProps {
  workspaceId: string;
  currentUserId: string;
  isOwner: boolean;
  canManage: boolean;
}

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: 'Владелец',
  ADMIN: 'Администратор',
  MEMBER: 'Участник',
  VIEWER: 'Наблюдатель',
};

export function WorkspaceMembersList({
  workspaceId,
  currentUserId,
  isOwner,
  canManage,
}: WorkspaceMembersListProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      const data = await response.json();
      setMembers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    setUpdatingMemberId(memberId);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update role');
      }

      fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setDeletingMemberId(memberId);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to remove member');
      }

      fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setDeletingMemberId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Участники</CardTitle>
        <CardDescription>Управление участниками workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет участников</p>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const isCurrentUser = member.user.id === currentUserId;
              const isMemberOwner = member.role === WorkspaceRole.OWNER;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{member.user.name || member.user.email}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && !isCurrentUser && !isMemberOwner ? (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.id, value as WorkspaceRole)}
                          disabled={updatingMemberId === member.id}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIEWER">Наблюдатель</SelectItem>
                            <SelectItem value="MEMBER">Участник</SelectItem>
                            <SelectItem value="ADMIN">Администратор</SelectItem>
                            {isOwner && <SelectItem value="OWNER">Владелец</SelectItem>}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={deletingMemberId === member.id}
                        >
                          {deletingMemberId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {roleLabels[member.role]}
                        {isCurrentUser && ' (Вы)'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

