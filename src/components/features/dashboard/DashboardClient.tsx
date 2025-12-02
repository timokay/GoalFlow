'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/components/features/dashboard/DashboardStats';
import { WorkspaceSelector } from '@/components/features/dashboard/WorkspaceSelector';
import { GoalsList } from '@/components/features/goals/GoalsList';

interface DashboardClientProps {
  userName: string | null;
}

export function DashboardClient({ userName }: DashboardClientProps) {
  const [workspaceId, setWorkspaceId] = useState<string>('');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userName}</p>
        </div>
        <WorkspaceSelector onWorkspaceChange={setWorkspaceId} />
      </div>

      {workspaceId && (
        <>
          <DashboardStats workspaceId={workspaceId} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Goals</CardTitle>
                <CardDescription>Your latest goals and their progress</CardDescription>
              </CardHeader>
              <CardContent>
                <GoalsList workspaceId={workspaceId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Quick actions will appear here</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!workspaceId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Please select a workspace to view your dashboard</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

