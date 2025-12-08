import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MetricService } from '@/lib/services/metricService';
import { updateMetricSchema } from '@/lib/validations';

async function ensureSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    const metric = await MetricService.getMetric(resolvedParams.id, session.user.id);
    return NextResponse.json({ data: metric });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Metric not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[METRIC_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch metric' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    const json = await req.json();
    const parsed = updateMetricSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const metric = await MetricService.updateMetric(resolvedParams.id, parsed.data, session.user.id);
    return NextResponse.json({ data: metric });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Metric not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[METRIC_PATCH]', error);
    return NextResponse.json({ error: 'Failed to update metric' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await ensureSession();

    await MetricService.deleteMetric(resolvedParams.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Metric not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[METRIC_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete metric' }, { status: 500 });
  }
}

