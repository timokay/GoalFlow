'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProgressTrend {
  date: string;
  averageProgress: number;
  goalsCount: number;
}

interface ProgressTrendChartProps {
  data: ProgressTrend[];
}

export function ProgressTrendChart({ data }: ProgressTrendChartProps) {
  const chartData = data.map((item) => ({
    date: item.date,
    'Средний прогресс': item.averageProgress,
    'Количество целей': item.goalsCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тренд прогресса</CardTitle>
        <CardDescription>Средний прогресс целей по неделям</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет данных для отображения
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="Средний прогресс"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorProgress)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

