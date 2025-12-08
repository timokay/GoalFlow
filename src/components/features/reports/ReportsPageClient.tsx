'use client';

import { useState } from 'react';
import { WorkspaceSelector } from '@/components/features/dashboard/WorkspaceSelector';
import { ReportBuilder } from './ReportBuilder';

export function ReportsPageClient() {
  const [workspaceId, setWorkspaceId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Создавайте настраиваемые отчеты по вашим целям</p>
        </div>
        <WorkspaceSelector onWorkspaceChange={setWorkspaceId} />
      </div>

      {workspaceId ? (
        <ReportBuilder workspaceId={workspaceId} />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Выберите workspace для создания отчета</p>
        </div>
      )}
    </div>
  );
}

