'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkspaceSelector } from '@/components/features/dashboard/WorkspaceSelector';
import { GoalStatus, GoalType } from '@prisma/client';
import { Loader2, FileText } from 'lucide-react';

interface ReportBuilderProps {
  workspaceId: string;
}

export function ReportBuilder({ workspaceId }: ReportBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [config, setConfig] = useState({
    startDate: '',
    endDate: '',
    statusFilter: [] as GoalStatus[],
    typeFilter: [] as GoalType[],
    includeMetrics: false,
    includeActivities: false,
    groupBy: undefined as 'user' | 'type' | 'status' | 'month' | undefined,
  });

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          startDate: config.startDate || undefined,
          endDate: config.endDate || undefined,
          statusFilter: config.statusFilter.length > 0 ? config.statusFilter : undefined,
          typeFilter: config.typeFilter.length > 0 ? config.typeFilter : undefined,
          includeMetrics: config.includeMetrics,
          includeActivities: config.includeActivities,
          groupBy: config.groupBy,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReportData(data.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Ошибка при генерации отчета');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (status: GoalStatus) => {
    setConfig((prev) => ({
      ...prev,
      statusFilter: prev.statusFilter.includes(status)
        ? prev.statusFilter.filter((s) => s !== status)
        : [...prev.statusFilter, status],
    }));
  };

  const toggleType = (type: GoalType) => {
    setConfig((prev) => ({
      ...prev,
      typeFilter: prev.typeFilter.includes(type)
        ? prev.typeFilter.filter((t) => t !== type)
        : [...prev.typeFilter, type],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>Создайте настраиваемый отчет по вашим целям</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Начальная дата</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Конечная дата</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={config.endDate}
                  onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Фильтр по статусу</Label>
              <div className="flex flex-wrap gap-4">
                {(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'CANCELLED'] as GoalStatus[]).map(
                  (status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={config.statusFilter.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <Label htmlFor={`status-${status}`} className="cursor-pointer">
                        {status}
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Фильтр по типу</Label>
              <div className="flex flex-wrap gap-4">
                {(['QUARTERLY', 'MONTHLY', 'WEEKLY'] as GoalType[]).map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={config.typeFilter.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <Label htmlFor={`type-${type}`} className="cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupBy">Группировка</Label>
              <Select
                value={config.groupBy || 'none'}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    groupBy: value === 'none' ? undefined : (value as any),
                  })
                }
              >
                <SelectTrigger id="groupBy">
                  <SelectValue placeholder="Без группировки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без группировки</SelectItem>
                  <SelectItem value="user">По пользователю</SelectItem>
                  <SelectItem value="type">По типу</SelectItem>
                  <SelectItem value="status">По статусу</SelectItem>
                  <SelectItem value="month">По месяцу</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetrics"
                  checked={config.includeMetrics}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeMetrics: checked as boolean })
                  }
                />
                <Label htmlFor="includeMetrics" className="cursor-pointer">
                  Включить метрики
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeActivities"
                  checked={config.includeActivities}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeActivities: checked as boolean })
                  }
                />
                <Label htmlFor="includeActivities" className="cursor-pointer">
                  Включить активность
                </Label>
              </div>
            </div>

            <Button onClick={handleGenerateReport} disabled={loading || !workspaceId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileText className="mr-2 h-4 w-4" />
              Сгенерировать отчет
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты отчета</CardTitle>
            <CardDescription>
              Всего целей: {reportData.summary.totalGoals} | Завершено:{' '}
              {reportData.summary.completedGoals} | Средний прогресс:{' '}
              {reportData.summary.averageProgress}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {config.groupBy && reportData.groupedData && (
                <div>
                  <h3 className="font-semibold mb-2">Группированные данные:</h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.groupedData).map(([key, data]: [string, any]) => (
                      <div key={key} className="p-3 border rounded">
                        <p className="font-medium">{key}</p>
                        <p className="text-sm text-muted-foreground">
                          Целей: {data.count} | Завершено: {data.completed} | Средний прогресс:{' '}
                          {data.averageProgress}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Цели ({reportData.goals.length}):</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {reportData.goals.map((goal: any) => (
                    <div key={goal.id} className="p-3 border rounded">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {goal.owner.name || goal.owner.email} • {goal.status} • {goal.type}
                          </p>
                          <p className="text-sm">Прогресс: {goal.progress}%</p>
                        </div>
                      </div>
                      {config.includeMetrics && goal.metrics && goal.metrics.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {goal.metrics.map((metric: any, idx: number) => (
                            <p key={idx} className="text-xs text-muted-foreground">
                              {metric.name}: {metric.currentValue} / {metric.targetValue}{' '}
                              {metric.unit}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

