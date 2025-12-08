'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EditMetricDialog } from './EditMetricDialog';

interface Metric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

interface MetricsListProps {
  goalId: string;
  onMetricCreated?: () => void;
}

export function MetricsList({ goalId, onMetricCreated }: MetricsListProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [goalId]);

  async function fetchMetrics() {
    try {
      setLoading(true);
      const response = await fetch(`/api/goals/${goalId}/metrics`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(metricId: string) {
    if (!confirm('Вы уверены, что хотите удалить эту метрику?')) {
      return;
    }

    try {
      const response = await fetch(`/api/metrics/${metricId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete metric');
      }

      setMetrics(metrics.filter((m) => m.id !== metricId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete metric');
    }
  }

  function handleMetricSaved() {
    fetchMetrics();
    setShowCreateDialog(false);
    setEditingMetric(null);
    onMetricCreated?.();
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
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

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Метрики</h3>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Добавить метрику
          </Button>
        </div>

        {metrics.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center py-4">
                Нет метрик. Добавьте первую метрику для отслеживания прогресса.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {metrics.map((metric) => {
              const percentage = (metric.currentValue / metric.targetValue) * 100;
              const isOverTarget = metric.currentValue > metric.targetValue;

              return (
                <Card key={metric.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{metric.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Цель: {metric.targetValue} {metric.unit}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingMetric(metric)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(metric.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Текущее значение</span>
                        <span className="font-semibold">
                          {metric.currentValue.toFixed(1)} {metric.unit}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isOverTarget ? 'bg-green-500' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {percentage.toFixed(1)}% от цели
                          {isOverTarget && ' (превышено!)'}
                        </span>
                        <span>
                          Осталось: {(metric.targetValue - metric.currentValue).toFixed(1)}{' '}
                          {metric.unit}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showCreateDialog && (
        <EditMetricDialog
          goalId={goalId}
          onClose={() => setShowCreateDialog(false)}
          onSaved={handleMetricSaved}
        />
      )}

      {editingMetric && (
        <EditMetricDialog
          goalId={goalId}
          metric={editingMetric}
          onClose={() => setEditingMetric(null)}
          onSaved={handleMetricSaved}
        />
      )}
    </>
  );
}

