'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoalStatus, GoalType } from '@prisma/client';
import { ChevronRight, ChevronDown, Plus, Target, Calendar } from 'lucide-react';
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
  parentId: string | null;
  children?: Goal[];
}

interface GoalHierarchyProps {
  workspaceId: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const typeLabels = {
  QUARTERLY: 'Квартальная',
  MONTHLY: 'Месячная',
  WEEKLY: 'Недельная',
};

function GoalTreeNode({ goal, level = 0 }: { goal: Goal; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // По умолчанию раскрыты первые 2 уровня
  const hasChildren = goal.children && goal.children.length > 0;

  return (
    <div className="mb-2">
      <div className="flex items-start gap-2" style={{ paddingLeft: `${level * 24}px` }}>
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <Link href={`/goals/${goal.id}`} className="flex-1">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate">{goal.title}</CardTitle>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[goal.status]}`}
                >
                  {goal.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{typeLabels[goal.type]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(goal.endDate).toLocaleDateString('ru-RU', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {hasChildren && (
                    <span className="text-muted-foreground">
                      {goal.children?.length} {goal.children?.length === 1 ? 'подцель' : 'подцелей'}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Прогресс</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {goal.children!.map((child) => (
            <GoalTreeNode key={child.id} goal={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GoalHierarchy({ workspaceId }: GoalHierarchyProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHierarchy() {
      try {
        setLoading(true);
        const response = await fetch(`/api/goals/hierarchy?workspaceId=${workspaceId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch goal hierarchy');
        }
        const data = await response.json();
        setGoals(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load goal hierarchy');
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) {
      fetchHierarchy();
    }
  }, [workspaceId]);

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
        <p className="text-sm text-muted-foreground mb-4">
          Нет целей. Создайте первую цель для начала!
        </p>
        <Link href="/goals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Создать цель
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {goals.map((goal) => (
        <GoalTreeNode key={goal.id} goal={goal} />
      ))}
    </div>
  );
}

