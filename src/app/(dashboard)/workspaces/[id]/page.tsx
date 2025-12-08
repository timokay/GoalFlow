import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WorkspaceDetailClient } from '@/components/features/workspace/WorkspaceDetailClient';

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const resolvedParams = await params;

  return <WorkspaceDetailClient workspaceId={resolvedParams.id} currentUserId={session.user.id} />;
}

