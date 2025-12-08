'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2, UserPlus, Settings } from 'lucide-react';
import Link from 'next/link';
import { WorkspaceMembersList } from './WorkspaceMembersList';
import { AddMemberDialog } from './AddMemberDialog';
import { EditWorkspaceDialog } from './EditWorkspaceDialog';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    goals: number;
    members: number;
  };
}

interface WorkspaceDetailClientProps {
  workspaceId: string;
  currentUserId: string;
}

export function WorkspaceDetailClient({ workspaceId, currentUserId }: WorkspaceDetailClientProps) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Workspace not found');
        }
        throw new Error('Failed to fetch workspace');
      }
      const data = await response.json();
      setWorkspace(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete workspace');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWorkspaceUpdated = () => {
    setIsEditDialogOpen(false);
    fetchWorkspace();
  };

  const handleMemberAdded = () => {
    setIsAddMemberDialogOpen(false);
    fetchWorkspace();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error || 'Workspace not found'}</p>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isOwner = workspace.ownerId === currentUserId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        {isOwner && (
          <div className="flex gap-2">
            <Link href={`/workspaces/${workspaceId}/settings`}>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{workspace.name}</CardTitle>
          {workspace.description && (
            <CardDescription className="mt-2">{workspace.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium">{workspace.owner.name || workspace.owner.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Goals</p>
              <p className="font-medium">{workspace._count.goals}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="font-medium">{workspace._count.members}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Team Members</h2>
        {isOwner && (
          <Button onClick={() => setIsAddMemberDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      <WorkspaceMembersList
        workspaceId={workspaceId}
        currentUserId={currentUserId}
        isOwner={isOwner}
        canManage={isOwner}
      />

      {isEditDialogOpen && (
        <EditWorkspaceDialog
          workspace={workspace}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onWorkspaceUpdated={handleWorkspaceUpdated}
        />
      )}

      {isAddMemberDialogOpen && (
        <AddMemberDialog
          open={isAddMemberDialogOpen}
          onOpenChange={setIsAddMemberDialogOpen}
          workspaceId={workspaceId}
          onMemberAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}

