'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface TeamMemberMetrics {
  userId: string;
  userName: string;
  userEmail: string;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  averageProgress: number;
  onTimeCompletionRate: number;
  averageCompletionTime: number;
}

interface TeamMetricsData {
  teamMetrics: TeamMemberMetrics[];
  summary: {
    totalMembers: number;
    totalGoals: number;
    totalCompleted: number;
    averageProgress: number;
    onTimeCompletionRate: number;
  };
}

interface TeamMetricsChartProps {
  workspaceId: string;
}

export function TeamMetricsChart({ workspaceId }: TeamMetricsChartProps) {
  const [data, setData] = useState<TeamMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamMetrics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/team?workspaceId=${workspaceId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team metrics');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team metrics');
      } finally {
        setLoading(false);
      }
    }

    if (workspaceId) {
      fetchTeamMetrics();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.teamMetrics.map((member) => ({
    name: member.userName || member.userEmail.split('@')[0],
    completed: member.completedGoals,
    active: member.activeGoals,
    avgProgress: member.averageProgress,
    onTimeRate: member.onTimeCompletionRate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance Metrics</CardTitle>
        <CardDescription>
          Overview of team member performance: {data.summary.totalMembers} members,{' '}
          {data.summary.totalGoals} total goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{data.summary.totalMembers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Goals</p>
              <p className="text-2xl font-bold">{data.summary.totalGoals}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
              <p className="text-2xl font-bold">{data.summary.averageProgress}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On-Time Rate</p>
              <p className="text-2xl font-bold">{data.summary.onTimeCompletionRate}%</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#4caf50" name="Completed Goals" />
              <Bar dataKey="active" fill="#2196f3" name="Active Goals" />
            </BarChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgProgress" fill="#ff9800" name="Avg Progress %" />
              <Bar dataKey="onTimeRate" fill="#9c27b0" name="On-Time Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

