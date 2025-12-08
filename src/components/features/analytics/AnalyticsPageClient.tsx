'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceSelector } from '@/components/features/dashboard/WorkspaceSelector';
import { GoalType } from '@prisma/client';
import { CompletionRateChart } from './CompletionRateChart';
import { TypeDistributionChart } from './TypeDistributionChart';
import { ProgressTrendChart } from './ProgressTrendChart';
import { TeamMetricsChart } from './TeamMetricsChart';
import { AnalyticsSummary } from './AnalyticsSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AnalyticsData } from '@/lib/services/statsService';

export function AnalyticsPageClient() {
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (workspaceId) {
      fetchAnalytics();
    }
  }, [workspaceId, startDate, endDate, typeFilter]);

  async function fetchAnalytics() {
    if (!workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        workspaceId,
      });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    // TODO: Реализовать экспорт в PDF/Excel
    alert('Экспорт будет реализован в следующей версии');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>
          <p className="text-muted-foreground">Анализ производительности и прогресса целей</p>
        </div>
        <div className="flex items-center gap-4">
          <WorkspaceSelector onWorkspaceChange={setWorkspaceId} />
          {analytics && (
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Экспорт
            </Button>
          )}
        </div>
      </div>

      {workspaceId && (
        <Card>
          <CardHeader>
            <CardTitle>Фильтры</CardTitle>
            <CardDescription>Выберите период для анализа</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Начальная дата</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Конечная дата</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="typeFilter">Тип цели</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="typeFilter">
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="QUARTERLY">Квартальные</SelectItem>
                    <SelectItem value="MONTHLY">Месячные</SelectItem>
                    <SelectItem value="WEEKLY">Недельные</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {analytics && !loading && (
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal Analytics</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="space-y-6 mt-6">
            <AnalyticsSummary
              averageCompletionTime={analytics.averageCompletionTime}
              onTimeCompletionRate={analytics.onTimeCompletionRate}
            />

            <CompletionRateChart data={analytics.completionRate} />

            <div className="grid gap-6 md:grid-cols-2">
              <TypeDistributionChart data={analytics.typeDistribution} />
              <ProgressTrendChart data={analytics.progressTrend} />
            </div>
          </TabsContent>
          <TabsContent value="team" className="mt-6">
            <TeamMetricsChart workspaceId={workspaceId} />
          </TabsContent>
        </Tabs>
      )}

      {!workspaceId && !loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center py-4">
              Выберите workspace для просмотра аналитики
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

