import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MetricService } from '@/lib/services/metricService';
import { createMetricSchema } from '@/lib/validations';

async function ensureSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    const metrics = await MetricService.listMetrics(resolvedParams.id, session.user.id);
    return NextResponse.json({ data: metrics });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Goal not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[METRICS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    const json = await req.json();
    const parsed = createMetricSchema.safeParse({ ...json, goalId: resolvedParams.id });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const metric = await MetricService.createMetric(parsed.data, session.user.id);
    return NextResponse.json({ data: metric }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Goal not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[METRICS_POST]', error);
    return NextResponse.json({ error: 'Failed to create metric' }, { status: 500 });
  }
}

