import { hash } from 'bcrypt';
import { PrismaClient, GoalStatus, GoalType, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Running GoalFlow seed...');

  const passwordHash = await hash('Password123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@goalflow.ai' },
    update: {},
    create: {
      email: 'demo@goalflow.ai',
      name: 'Demo User',
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: 'workspace-demo' },
    update: {},
    create: {
      id: 'workspace-demo',
      name: 'Demo Workspace',
      description: 'Workspace for demo data',
      ownerId: user.id,
    },
  });

  await prisma.workspaceUser.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {
      role: WorkspaceRole.OWNER,
    },
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: WorkspaceRole.OWNER,
    },
  });

  const goalsCount = await prisma.goal.count({
    where: {
      workspaceId: workspace.id,
    },
  });

  if (goalsCount === 0) {
    await prisma.goal.createMany({
      data: [
        {
          title: 'Запустить новый процесс OKR',
          description: 'Подготовить процесс постановки целей на следующий квартал',
          status: GoalStatus.ACTIVE,
          type: GoalType.QUARTERLY,
          ownerId: user.id,
          workspaceId: workspace.id,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-03-31'),
          progress: 40,
        },
        {
          title: 'Автоматизировать отчеты по целям',
          description: 'Подготовить шаблоны отчетов и внедрить автоматизацию',
          status: GoalStatus.REVIEW,
          type: GoalType.MONTHLY,
          ownerId: user.id,
          workspaceId: workspace.id,
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-02-28'),
          progress: 70,
        },
        {
          title: 'Подготовить weekly sync',
          description: 'Создать структуру weekly-sync и чеклист',
          status: GoalStatus.DRAFT,
          type: GoalType.WEEKLY,
          ownerId: user.id,
          workspaceId: workspace.id,
          startDate: new Date('2025-02-17'),
          endDate: new Date('2025-02-23'),
          progress: 10,
        },
      ],
    });
  }

  console.log('✅ Seed completed');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

