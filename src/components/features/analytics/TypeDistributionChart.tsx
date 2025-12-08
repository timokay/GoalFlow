'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GoalType } from '@prisma/client';

interface GoalTypeDistribution {
  type: GoalType;
  count: number;
  percentage: number;
}

interface TypeDistributionChartProps {
  data: GoalTypeDistribution[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const typeLabels: Record<GoalType, string> = {
  QUARTERLY: 'Квартальные',
  MONTHLY: 'Месячные',
  WEEKLY: 'Недельные',
};

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const chartData = data.map((item) => ({
    name: typeLabels[item.type],
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Распределение по типам</CardTitle>
        <CardDescription>Соотношение целей по типам</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет данных для отображения
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

