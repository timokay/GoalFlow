import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GoalDetailClient } from '@/components/features/goals/GoalDetailClient';

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  return <GoalDetailClient goalId={id} />;
}

