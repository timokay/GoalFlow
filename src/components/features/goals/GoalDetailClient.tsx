'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalStatus, GoalType } from '@prisma/client';
import { Edit, Trash2, ArrowLeft, Calendar, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { EditGoalDialog } from './EditGoalDialog';

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
  updatedAt: string;
  workspaceId: string;
}

interface GoalDetailClientProps {
  goalId: string;
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

export function GoalDetailClient({ goalId }: GoalDetailClientProps) {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchGoal() {
      try {
        setLoading(true);
        const response = await fetch(`/api/goals/${goalId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Goal not found');
          }
          throw new Error('Failed to fetch goal');
        }
        const data = await response.json();
        setGoal(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load goal');
      } finally {
        setLoading(false);
      }
    }

    fetchGoal();
  }, [goalId]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      router.push('/goals');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGoalUpdated = () => {
    setIsEditDialogOpen(false);
    // Refresh goal data
    fetch(`/api/goals/${goalId}`)
      .then((res) => res.json())
      .then((data) => setGoal(data.data))
      .catch(console.error);
    router.refresh();
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
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error || 'Goal not found'}</p>
          <Link href="/goals">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Goals
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/goals">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Goals
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{goal.title}</CardTitle>
              {goal.description && (
                <CardDescription className="mt-2">{goal.description}</CardDescription>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[goal.status]}`}>
              {goal.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Type: {typeLabels[goal.type]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(goal.startDate).toLocaleDateString('ru-RU', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                -{' '}
                {new Date(goal.endDate).toLocaleDateString('ru-RU', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <p>Created: {new Date(goal.createdAt).toLocaleString('ru-RU')}</p>
              <p className="mt-1">Last updated: {new Date(goal.updatedAt).toLocaleString('ru-RU')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditDialogOpen && (
        <EditGoalDialog
          goal={goal}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onGoalUpdated={handleGoalUpdated}
        />
      )}
    </div>
  );
}

