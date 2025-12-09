import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';
import Link from 'next/link';
import { Goal, BarChart3, Settings, Menu } from 'lucide-react';

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  return (
    <nav className="border-b bg-background fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Goal className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">GoalFlow</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/goals"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Goals
              </Link>
              <Link
                href="/analytics"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Analytics
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session.user.name || session.user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

