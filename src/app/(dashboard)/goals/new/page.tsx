import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CreateGoalForm } from '@/components/forms/CreateGoalForm';

export default async function NewGoalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Goal</h1>
        <p className="text-muted-foreground">Create a new goal to track your progress</p>
      </div>
      <CreateGoalForm />
    </div>
  );
}

