'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

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

  useEffect(() => {
    async function fetchWorkspaces() {
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
    }

    fetchWorkspaces();
  }, [onWorkspaceChange]);

  if (loading) {
    return <Skeleton className="h-10 w-64" />;
  }

  if (workspaces.length === 0) {
    return <p className="text-sm text-muted-foreground">No workspaces found</p>;
  }

  return (
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
  );
}

