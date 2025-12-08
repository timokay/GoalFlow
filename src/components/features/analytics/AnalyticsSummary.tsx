'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle2, TrendingUp } from 'lucide-react';

interface AnalyticsSummaryProps {
  averageCompletionTime: number;
  onTimeCompletionRate: number;
}

export function AnalyticsSummary({
  averageCompletionTime,
  onTimeCompletionRate,
}: AnalyticsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Среднее время выполнения</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageCompletionTime}</div>
          <p className="text-xs text-muted-foreground">дней</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Выполнение в срок</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{onTimeCompletionRate}%</div>
          <p className="text-xs text-muted-foreground">целей завершено вовремя</p>
        </CardContent>
      </Card>
    </div>
  );
}

