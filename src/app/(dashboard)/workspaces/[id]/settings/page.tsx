import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WorkspaceSettingsClient } from '@/components/features/workspace/WorkspaceSettingsClient';

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const resolvedParams = await params;

  return <WorkspaceSettingsClient workspaceId={resolvedParams.id} currentUserId={session.user.id} />;
}

