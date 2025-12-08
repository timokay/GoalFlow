import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReportService } from '@/lib/services/reportService';
import { z } from 'zod';

const reportConfigSchema = z.object({
  workspaceId: z.string().cuid(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  statusFilter: z.array(z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'CANCELLED'])).optional(),
  typeFilter: z.array(z.enum(['QUARTERLY', 'MONTHLY', 'WEEKLY'])).optional(),
  includeMetrics: z.boolean().optional(),
  includeActivities: z.boolean().optional(),
  groupBy: z.enum(['user', 'type', 'status', 'month']).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = reportConfigSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const report = await ReportService.generateReport({
      ...parsed.data,
      userId: session.user.id,
    });

    return NextResponse.json({ data: report });
  } catch (error) {
    if (error instanceof Error && error.message === 'Workspace access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('[REPORTS_POST]', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

