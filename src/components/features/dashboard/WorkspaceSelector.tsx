'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { CreateWorkspaceDialog } from '@/components/features/workspace/CreateWorkspaceDialog';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
}

interface WorkspaceSelectorProps {
  onWorkspaceChange: (workspaceId: string) => void;
}

export function WorkspaceSelector({ onWorkspaceChange }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }
      const data = await response.json();
      const workspacesList = data.data || [];
      setWorkspaces(workspacesList);
      if (workspacesList.length > 0) {
        const firstWorkspace = workspacesList[0].id;
        setSelectedWorkspace(firstWorkspace);
        onWorkspaceChange(firstWorkspace);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleWorkspaceCreated = () => {
    fetchWorkspaces();
  };

  if (loading) {
    return <Skeleton className="h-10 w-64" />;
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedWorkspace}
        onValueChange={(value) => {
          setSelectedWorkspace(value);
          onWorkspaceChange(value);
        }}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              {workspace.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCreateDialogOpen(true)}
        title="Create new workspace"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onWorkspaceCreated={handleWorkspaceCreated}
      />
    </div>
  );
}

