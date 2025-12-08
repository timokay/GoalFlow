'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CompletionRateData {
  period: string;
  completed: number;
  total: number;
  rate: number;
}

interface CompletionRateChartProps {
  data: CompletionRateData[];
}

export function CompletionRateChart({ data }: CompletionRateChartProps) {
  const chartData = data.map((item) => ({
    period: item.period,
    'Процент выполнения': item.rate,
    'Завершено': item.completed,
    'Всего': item.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Процент выполнения целей</CardTitle>
        <CardDescription>Динамика завершения целей по месяцам</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет данных для отображения
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Процент выполнения"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

