'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoalsList } from '@/components/features/goals/GoalsList';
import { WorkspaceSelector } from '@/components/features/dashboard/WorkspaceSelector';
import { Plus, Filter } from 'lucide-react';
import Link from 'next/link';

export function GoalsPageClient() {
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Manage and track your goals</p>
        </div>
        <div className="flex items-center gap-4">
          <WorkspaceSelector onWorkspaceChange={setWorkspaceId} />
          <Link href="/goals/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </Link>
        </div>
      </div>

      {workspaceId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Goals</CardTitle>
                <CardDescription>View and manage all your goals</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GoalsList workspaceId={workspaceId} />
          </CardContent>
        </Card>
      )}

      {!workspaceId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Please select a workspace to view your goals</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

