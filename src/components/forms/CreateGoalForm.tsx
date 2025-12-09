'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createGoalSchema, type CreateGoalInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceSelector } from '@/components/features/dashboard/WorkspaceSelector';
import { Loader2 } from 'lucide-react';

export function CreateGoalForm() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentGoals, setParentGoals] = useState<Array<{ id: string; title: string; type: string }>>([]);
  const [loadingParentGoals, setLoadingParentGoals] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      type: 'QUARTERLY',
      parentId: '',
    },
  });

  const type = watch('type');
  const parentId = watch('parentId') || '';

  useEffect(() => {
    if (workspaceId) {
      setValue('workspaceId', workspaceId);
      // Загружаем список целей для выбора родителя
      fetchParentGoals(workspaceId);
    }
  }, [workspaceId, setValue]);

  const fetchParentGoals = async (wsId: string) => {
    if (!wsId) return;
    setLoadingParentGoals(true);
    try {
      const response = await fetch(`/api/goals?workspaceId=${wsId}`);
      if (response.ok) {
        const data = await response.json();
        // Фильтруем только QUARTERLY и MONTHLY цели (WEEKLY не могут быть родителями)
        const availableParents = (data.data || []).filter(
          (goal: any) => goal.type === 'QUARTERLY' || goal.type === 'MONTHLY',
        );
        setParentGoals(availableParents);
      }
    } catch (err) {
      console.error('Failed to fetch parent goals:', err);
    } finally {
      setLoadingParentGoals(false);
    }
  };

  const onSubmit = async (data: any) => {
    if (!workspaceId) {
      setError('Please select a workspace');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Преобразуем строки дат в ISO формат для API
      // Преобразуем пустую строку parentId в undefined
      const payload: CreateGoalInput = {
        ...data,
        workspaceId,
        parentId: data.parentId && data.parentId.trim() !== '' ? data.parentId : undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create goal');
      }

      router.push('/goals');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Goal</CardTitle>
        <CardDescription>Set up a new goal to track your progress</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <WorkspaceSelector onWorkspaceChange={setWorkspaceId} />
            {!workspaceId && (
              <p className="text-sm text-destructive">Please select a workspace</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter goal title"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Enter goal description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={type}
                onValueChange={(value) => setValue('type', value as 'QUARTERLY' | 'MONTHLY' | 'WEEKLY')}
              >
                <SelectTrigger id="type" className={errors.type ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {type !== 'WEEKLY' && (
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Goal (Optional)</Label>
                <Select
                  value={parentId || 'none'}
                  onValueChange={(value) => setValue('parentId', value === 'none' ? '' : value)}
                  disabled={loadingParentGoals}
                >
                  <SelectTrigger id="parentId" className={errors.parentId ? 'border-destructive' : ''}>
                    <SelectValue placeholder={loadingParentGoals ? 'Loading...' : 'Select parent goal (optional)'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="none">None (Top-level goal)</SelectItem>
                    {parentGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title} ({goal.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentId && (
                  <p className="text-sm text-destructive">{errors.parentId.message}</p>
                )}
                {!loadingParentGoals && parentGoals.length === 0 && workspaceId && (
                  <p className="text-xs text-muted-foreground">
                    No QUARTERLY or MONTHLY goals available to use as parent. You can create a top-level goal.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                className={errors.startDate ? 'border-destructive' : ''}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                className={errors.endDate ? 'border-destructive' : ''}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || !workspaceId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Goal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

