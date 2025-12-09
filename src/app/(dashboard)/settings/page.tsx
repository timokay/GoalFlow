import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Bell, MessageSquare, User } from 'lucide-react';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const settingsSections = [
    {
      title: 'Telegram Integration',
      description: 'Link your Telegram account to receive notifications',
      href: '/settings/telegram',
      icon: MessageSquare,
    },
    {
      title: 'Notification Preferences',
      description: 'Manage your notification settings',
      href: '/settings/notifications',
      icon: Bell,
      comingSoon: true,
    },
    {
      title: 'Profile Settings',
      description: 'Update your profile information',
      href: '/settings/profile',
      icon: User,
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          const content = (
            <Card className={section.comingSoon ? 'opacity-60' : 'hover:shadow-md transition-shadow cursor-pointer'}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {section.comingSoon && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Coming Soon</span>
                )}
              </CardContent>
            </Card>
          );

          if (section.comingSoon) {
            return <div key={section.href}>{content}</div>;
          }

          return (
            <Link key={section.href} href={section.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

