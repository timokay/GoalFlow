'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoalStatus, GoalType } from '@prisma/client';
import { Plus, Calendar, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  type: GoalType;
  progress: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface GoalsListProps {
  workspaceId: string;
  initialGoals?: any[];
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const typeLabels = {
  QUARTERLY: 'Quarterly',
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
};

export function GoalsList({ workspaceId, initialGoals }: GoalsListProps) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals || []);
  const [loading, setLoading] = useState(!initialGoals);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialGoals) {
      setGoals(initialGoals);
      setLoading(false);
      return;
    }

    async function fetchGoals() {
      try {
        setLoading(true);
        const response = await fetch(`/api/goals?workspaceId=${workspaceId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch goals');
        }
        const data = await response.json();
        setGoals(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load goals');
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) {
      fetchGoals();
    }
  }, [workspaceId, initialGoals]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
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

  if (goals.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-4">No goals yet. Create your first goal to get started!</p>
        <Link href="/goals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Goal
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="grid gap-4">
        {goals.map((goal) => (
          <Link key={goal.id} href={`/goals/${goal.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    {goal.description && (
                      <CardDescription className="mt-1">{goal.description}</CardDescription>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[goal.status]}`}
                  >
                    {goal.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{typeLabels[goal.type]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(goal.endDate).toLocaleDateString('ru-RU', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

