'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoalsList } from '@/components/features/goals/GoalsList';
import { GoalHierarchy } from '@/components/features/goals/GoalHierarchy';
import { SearchGoals } from '@/components/features/goals/SearchGoals';
import { WorkspaceSelector } from '@/components/features/dashboard/WorkspaceSelector';
import { Plus, Filter, List, TreePine, Search } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                <CardTitle>Ваши цели</CardTitle>
                <CardDescription>Просмотр и управление всеми вашими целями</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Фильтр по статусу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="DRAFT">Черновик</SelectItem>
                    <SelectItem value="ACTIVE">Активна</SelectItem>
                    <SelectItem value="REVIEW">На проверке</SelectItem>
                    <SelectItem value="COMPLETED">Завершена</SelectItem>
                    <SelectItem value="CANCELLED">Отменена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list">
                  <List className="mr-2 h-4 w-4" />
                  Список
                </TabsTrigger>
                <TabsTrigger value="hierarchy">
                  <TreePine className="mr-2 h-4 w-4" />
                  Иерархия
                </TabsTrigger>
                <TabsTrigger value="search">
                  <Search className="mr-2 h-4 w-4" />
                  Поиск
                </TabsTrigger>
              </TabsList>
              <TabsContent value="list" className="mt-4">
                <GoalsList workspaceId={workspaceId} />
              </TabsContent>
              <TabsContent value="hierarchy" className="mt-4">
                <GoalHierarchy workspaceId={workspaceId} />
              </TabsContent>
              <TabsContent value="search" className="mt-4">
                <SearchGoals workspaceId={workspaceId} />
              </TabsContent>
            </Tabs>
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

