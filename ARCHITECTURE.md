# GoalFlow - Архитектурный План Проекта

## 📋 Обзор Проекта

**GoalFlow** - корпоративная система управления целями с интеграцией Telegram и AI-ассистентом для повышения продуктивности команд. (Цель: Реорганизовать таблицу в Excel, которую ведут менеджеры с фокусными целями департамента как в ui clickup)

### Ключевые характеристики

- **Подход**: Full-stack на Next.js 14 с App Router
- **Разработка**: AI-first development с Cursor AI
- **Сроки**: 16-20 недель разработки
- **Оценка архитектуры**: 8.4/10

### Основной функционал

1. Аутентификация и авторизация (NextAuth.js)
2. Управление целями с иерархией
3. Отслеживание метрик и KPI
4. Telegram-интеграция для уведомлений
5. Аналитика и отчеты
6. Мультитенантность через Workspace

---

## 🏗️ Технологический Стек

### Frontend

- **Next.js 14** - App Router, Server Components, Streaming
- **React 18** - UI библиотека
- **TypeScript** - Type safety
- **Tailwind CSS** - Стилизация
- **shadcn/ui** - UI компоненты
- **React Query** - Server state management
- **Zustand** - Client state (опционально)

### Backend

- **Next.js API Routes** - RESTful API
- **Prisma ORM** - Type-safe database access
- **NextAuth.js** - Аутентификация
- **Zod** - Валидация данных
- **tRPC** - Type-safe API (опционально)

### Database

- **PostgreSQL 15+** - Основная БД
- **Supabase** - Managed PostgreSQL
- **Redis/Upstash** - Кеширование (для масштабирования)

### External Services

- **grammy.js** - Telegram Bot Framework
- **Resend** - Email отправка
- **UploadThing** - Файловое хранилище

### Infrastructure

- **Vercel** - Hosting и deployment
- **GitHub Actions** - CI/CD
- **Sentry** - Error tracking (рекомендуется)

---

## 📊 Схема Базы Данных

### Основные модели

```prisma
model User {
  id           String          @id @default(cuid())
  email        String          @unique
  name         String?
  passwordHash String
  telegramId   String?         @unique

  goals        Goal[]
  workspaces   WorkspaceUser[]
  ownedWorkspaces Workspace[]  @relation("WorkspaceOwner")

  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

model Workspace {
  id          String          @id @default(cuid())
  name        String
  description String?
  ownerId     String

  owner       User            @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members     WorkspaceUser[]
  goals       Goal[]

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Goal {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      GoalStatus @default(DRAFT)
  type        GoalType

  ownerId     String
  owner       User       @relation(fields: [ownerId], references: [id])

  workspaceId String
  workspace   Workspace  @relation(fields: [workspaceId], references: [id])

  parentId    String?
  parent      Goal?      @relation("GoalHierarchy", fields: [parentId], references: [id])
  children    Goal[]     @relation("GoalHierarchy")

  metrics     Metric[]

  startDate   DateTime
  endDate     DateTime
  progress    Int        @default(0) // 0-100

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([ownerId, status])
  @@index([workspaceId, status])
  @@index([parentId])
}

model Metric {
  id           String   @id @default(cuid())
  name         String
  currentValue Float    @default(0)
  targetValue  Float
  unit         String

  goalId       String
  goal         Goal     @relation(fields: [goalId], references: [id])

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum GoalStatus {
  DRAFT
  ACTIVE
  REVIEW
  COMPLETED
  CANCELLED
}

enum GoalType {
  QUARTERLY
  MONTHLY
  WEEKLY
}

enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

### Ключевые индексы

- `Goal`: composite indexes на `(ownerId, status)`, `(workspaceId, status)`, `(endDate, status)`
- `User`: unique indexes на `email`, `telegramId`
- `WorkspaceUser`: composite unique на `(userId, workspaceId)`

---

## 🗂️ Структура Проекта

```
goalflow/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── migrations/            # DB migrations
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # Main dashboard
│   │   │   ├── goals/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── goals/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── metrics/route.ts
│   │   │   ├── telegram/route.ts
│   │   │   └── reports/route.ts
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── forms/             # Form components
│   │   ├── charts/            # Chart components
│   │   ├── layout/            # Layout components
│   │   └── features/          # Feature-specific components
│   │       ├── goals/
│   │       ├── analytics/
│   │       └── workspace/
│   │
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client
│   │   ├── utils.ts           # Utility functions
│   │   ├── validations.ts     # Zod schemas
│   │   └── services/          # Business logic
│   │       ├── goalService.ts
│   │       ├── metricService.ts
│   │       ├── notificationService.ts
│   │       └── telegramService.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── goals.ts
│   │   └── api.ts
│   │
│   └── hooks/
│       ├── use-goals.ts
│       ├── use-auth.ts
│       └── use-workspace.ts
│
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── e2e/                   # E2E tests
│   └── mocks/                 # Mock data
│
├── .env.local
├── .cursorrules
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 📅 План Разработки (16-20 недель)

### Этап 0: Setup & Foundation (Недели 1-2)

**Цели:**

- Инициализация проекта с базовой архитектурой
- Настройка dev окружения и CI/CD
- Базовая структура папок

**Задачи:**

1. ✅ Создать Next.js 14 проект с TypeScript
2. ✅ Настроить ESLint, Prettier, Husky
3. ✅ Инициализировать Prisma + Supabase
4. ✅ Настроить Tailwind CSS + shadcn/ui
5. ✅ Создать структуру папок
6. ✅ Настроить .cursorrules для AI
7. ✅ Настроить GitHub Actions
8. ✅ Создать базовую документацию

---

### Этап 1.1: Authentication (Недели 3-4)

**Цели:**

- Полная система аутентификации
- Управление сессиями
- User management

**Задачи:**

1. Настроить NextAuth.js с credentials provider
2. Реализовать User модель в Prisma
3. API endpoints для регистрации и логина
4. Middleware для защиты роутов
5. Login/Register страницы
6. Password hashing (bcrypt)
7. Session management
8. User profile страница

---

### Этап 1.2: Database & Goals CRUD (Недели 5-6)

**Цели:**

- Полная схема БД
- CRUD операции для целей

**Задачи:**

1. Создать полную Prisma схему (Goal, Metric, Workspace)
2. Database migrations
3. Seed скрипты с тестовыми данными
4. API endpoints для Goals CRUD
5. Zod validation schemas
6. TypeScript типы для Prisma
7. Error handling в API
8. API тесты

---

### Этап 1.3: Basic UI & Dashboard (Недели 7-8)

**Цели:**

- Базовый пользовательский интерфейс
- Dashboard с основной функциональностью

**Задачи:**

1. Настроить shadcn/ui компоненты
2. Layout компоненты (Navbar, Sidebar)
3. Dashboard page со статистикой
4. Goals list с фильтрацией
5. Goal creation form
6. Goal detail page
7. Goal edit functionality
8. Responsive design
9. Loading states и скелетоны
10. Error boundaries

---

### Этап 1.4: Telegram Integration (Недели 9-10)

**Цели:**

- Интеграция с Telegram
- Базовая функциональность бота

**Задачи:**

1. Настроить grammy.js bot
2. Webhook endpoint для Telegram
3. User linking (Telegram ID ↔ GoalFlow User)
4. Bot команды: /start, /help, /goals
5. /report команда для отчетов
6. Notification system базовая
7. Message templates
8. Bot тесты

---

### Этап 1.5: Goal Hierarchy & Metrics (Недели 11-12)

**Цели:**

- Иерархия целей (parent-child)
- Система метрик

**Задачи:**

1. Реализовать parent-child отношения
2. UI для создания подцелей
3. Goal hierarchy visualizer (дерево)
4. Progress roll-up (автообновление прогресса родителя)
5. Metrics CRUD API
6. Metrics UI компоненты
7. Charts для метрик (recharts)
8. Оптимизация производительности иерархии

---

### Этап 2.1: Analytics & Reports (Недели 13-14)

**Цели:**

- Аналитика и отчетность
- Визуализация данных

**Задачи:**

1. Dashboard analytics компоненты
2. Goal completion rate charts
3. Team performance metrics
4. Export to PDF/Excel
5. Custom report builder (базовый)
6. Historical data tracking
7. Trend analysis
8. API endpoints для аналитики

---

### Этап 2.2: Workspace & Teams (Недели 15-16)

**Цели:**

- Мультитенантность
- Управление командами

**Задачи:**

1. Workspace CRUD API
2. Workspace selector UI
3. Team member management
4. Roles & Permissions (RBAC)
5. Workspace settings
6. Invite system (email)
7. Workspace switching
8. Access control middleware

---

### Этап 3: Notifications & Advanced Features (Недели 17-18)

**Цели:**

- Расширенные уведомления
- Дополнительные фичи

**Задачи:**

1. Email notifications (Resend)
2. Notification preferences
3. Telegram notifications advanced
4. Deadline reminders
5. Goal templates
6. Bulk operations
7. Search functionality
8. Activity feed

---

### Этап 4: Testing & Optimization (Недели 19-20)

**Цели:**

- Comprehensive testing
- Performance optimization
- Production readiness

**Задачи:**

1. Unit tests (Vitest) - 80% coverage
2. Integration tests - критичные flow
3. E2E tests (Playwright) - основные сценарии
4. Performance optimization
5. Security audit
6. Error tracking setup (Sentry)
7. Analytics setup (Vercel Analytics)
8. Documentation финализация

---

## 🔑 Ключевые Архитектурные Решения

### 1. Next.js 14 с App Router

**Преимущества:**

- Server Components для оптимизации производительности
- Streaming и Suspense для лучшего UX
- Автоматическая оптимизация изображений
- Built-in API routes

**Оценка: 9/10**

### 2. Prisma ORM

**Преимущества:**

- Type-safe database access
- Автоматическая миграция
- Отличный DX

**Потенциальные проблемы:**

- N+1 query problem при работе с иерархией (требуется оптимизация)

**Оценка: 8/10**

### 3. Иерархия целей

**Реализация:**

- Self-referencing через `parentId`
- Поддержка неограниченной вложенности
- Multi-tenancy через Workspace

**Рекомендации для улучшения:**

- Добавить soft delete (`deletedAt`)
- Добавить audit trail
- Рассмотреть denormalization для progress

**Оценка: 8/10**

---

## ⚠️ Критичные Проблемы и Решения

### Проблема 1: Производительность глубоких иерархий

**Решение:**

```typescript
// Использовать Recursive CTE для PostgreSQL
const goalsWithHierarchy = await prisma.$queryRaw`
  WITH RECURSIVE goal_tree AS (
    SELECT g.*, 1 as level
    FROM "Goal" g
    WHERE g."parentId" IS NULL
    
    UNION ALL
    
    SELECT g.*, gt.level + 1
    FROM "Goal" g
    INNER JOIN goal_tree gt ON g."parentId" = gt.id
  )
  SELECT * FROM goal_tree
  ORDER BY level, title
`;
```

### Проблема 2: Автообновление прогресса родителей

**Решение:**

```typescript
// Использовать транзакции и рекурсивное обновление
export class GoalService {
  static async updateGoalProgress(goalId: string, progress: number) {
    await prisma.$transaction(async (tx) => {
      await tx.goal.update({
        where: { id: goalId },
        data: { progress },
      });

      const goal = await tx.goal.findUnique({
        where: { id: goalId },
        select: { parentId: true },
      });

      if (goal?.parentId) {
        await this.updateParentProgress(tx, goal.parentId);
      }
    });
  }
}
```

### Проблема 3: Масштабируемость Telegram бота

**Решение:**

- Использовать queue (BullMQ) для background processing
- Быстрый response на webhook (< 5ms)
- Обработка сообщений в фоне

---

## 📝 Стратегия Тестирования

### Testing Pyramid

1. **Unit Tests (60%)** - Vitest
   - Utility functions
   - Services
   - Custom hooks
   - Components

2. **Integration Tests (30%)** - Vitest + MSW
   - API endpoints
   - Database operations
   - Service layer integration

3. **E2E Tests (10%)** - Playwright
   - Critical user flows
   - Authentication
   - Goal lifecycle
   - Telegram integration

### Цели покрытия

- Unit: ≥ 80%
- Integration: ≥ 70%
- Overall: ≥ 70%

---

## 🚀 Deployment & Infrastructure

### Development

```bash
npm run dev          # Запуск dev server
npm run db:push      # Синхронизация схемы БД
npm run db:seed      # Заполнение тестовыми данными
npm run test         # Запуск тестов
```

### Production

```bash
npm run build        # Production build
npm run start        # Запуск production server
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Telegram
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_WEBHOOK_SECRET="..."

# Email
RESEND_API_KEY="..."

# Monitoring (optional)
SENTRY_DSN="..."
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="..."
```

### CI/CD Pipeline

1. Lint & Format check
2. Type checking
3. Unit & Integration tests
4. E2E tests (на staging)
5. Build
6. Deploy на Vercel

---

## 📈 Масштабирование

### MVP (0-1K users)

- **Стоимость**: ~$25/месяц
- **Стек**: Vercel Hobby + Supabase Free
- **RPS**: ~100 requests/minute

### Growth (1K-10K users)

- **Стоимость**: ~$80/месяц
- **Стек**: Vercel Pro + Supabase Pro
- **RPS**: ~1,000 requests/minute
- **Требуется**:
  - Redis caching (Upstash)
  - Rate limiting
  - Query optimization

### Scale (10K-100K users)

- **Стоимость**: ~$500-1000/месяц
- **Стек**: Vercel Enterprise + Dedicated DB
- **RPS**: ~10,000 requests/minute
- **Требуется**:
  - CDN для статики
  - Database read replicas
  - Background job queue
  - Microservices (опционально)

---

## ✅ Production Checklist

### Безопасность

- [ ] Rate limiting настроен (Upstash)
- [ ] Input validation везде (Zod)
- [ ] CSRF protection
- [ ] Security headers (helmet)
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection
- [ ] Audit logging

### Производительность

- [ ] Database indexes оптимизированы
- [ ] Caching layer настроен
- [ ] Image optimization (Next.js)
- [ ] Bundle size оптимизирован
- [ ] Lazy loading компонентов
- [ ] API response compression

### Мониторинг

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Logging infrastructure
- [ ] Uptime monitoring
- [ ] Database monitoring

### Тестирование

- [ ] Unit tests: ≥ 80% coverage
- [ ] Integration tests: критичные flows
- [ ] E2E tests: основные сценарии
- [ ] Load testing проведен
- [ ] Security audit выполнен

---

## 📚 Дополнительные Рекомендации

### Для старта разработки

1. ✅ Создать comprehensive .cursorrules
2. ✅ Настроить seed data для тестирования
3. ✅ Подготовить mock data для всех компонентов

### До запуска production

1. 🔸 Провести security audit (OWASP Top 10)
2. 🔸 Выполнить load testing
3. 🔸 Настроить мониторинг и алерты
4. 🔸 Подготовить документацию для API

### После запуска

1. 📊 Собирать метрики использования
2. 🐛 Отслеживать ошибки (Sentry)
3. 💬 Собирать feedback пользователей
4. 🔄 Итеративно улучшать производительность

---

## 🎯 Итоговая Оценка

**Общая оценка архитектуры: 8.4/10** ⭐⭐⭐⭐

**Сильные стороны:**

- ✅ Современный технологический стек
- ✅ Отличный Developer Experience
- ✅ Comprehensive testing strategy
- ✅ Хорошая масштабируемость
- ✅ AI-friendly подход

**Области для улучшения:**

- ⚠️ Оптимизация производительности иерархий
- ⚠️ Добавить rate limiting
- ⚠️ Улучшить security hardening
- ⚠️ Настроить мониторинг

**Вывод**: Архитектура хорошо продумана для solo-разработки с AI-ассистентом. Выбранный Next.js подход оптимален для быстрой разработки. Основные риски связаны с производительностью при работе с глубокими иерархиями - требуется профилактическая оптимизация.

---

**Версия документа**: 1.0  
**Дата**: 11.11.2025  
**Готово к старту разработки**: ✅
