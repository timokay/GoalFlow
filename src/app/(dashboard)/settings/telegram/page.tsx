import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TelegramLinkClient } from '@/components/features/settings/TelegramLinkClient';

export default async function TelegramLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;

  return <TelegramLinkClient token={params.token} />;
}

