# GoalFlow

Корпоративная система управления целями с интеграцией Telegram и AI-ассистентом для повышения продуктивности команд.

## 🚀 Быстрый старт

### Требования

- Node.js 18+ 
- PostgreSQL 15+
- npm или yarn

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/timokay/GoalFlow.git
cd GoalFlow

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
# Отредактировать .env и добавить необходимые ключи

# Настроить базу данных
npx prisma migrate dev
npx prisma generate

# Заполнить тестовыми данными (опционально)
npm run db:seed

# Запустить dev server
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## 📋 Основные возможности

- ✅ **Аутентификация** - Регистрация и вход через NextAuth.js
- ✅ **Управление целями** - CRUD операции для целей с валидацией
- ✅ **Иерархия целей** - Поддержка parent-child отношений
- ✅ **Метрики** - Отслеживание прогресса через метрики
- ✅ **Workspace & Teams** - Мультитенантность и управление командами
- ✅ **RBAC** - Система ролей и прав доступа
- ✅ **Аналитика** - Визуализация данных и отчеты
- ✅ **Team Performance Metrics** - Метрики производительности команды
- ✅ **Custom Report Builder** - Настраиваемые отчеты с фильтрами и группировкой
- ✅ **Telegram Integration** - Бот для уведомлений и отчетов
- ✅ **Email Notifications** - Уведомления через Resend
- ✅ **Notification Preferences** - Настройка уведомлений
- ✅ **Goal Templates** - Шаблоны для быстрого создания целей
- ✅ **Bulk Operations** - Массовые операции над целями
- ✅ **Search** - Полнотекстовый поиск по целям
- ✅ **Activity Feed** - Лента активности workspace
- ✅ **Workspace Invites** - Система приглашений по email

## 🛠 Технологический стек

### Frontend
- **Next.js 14** - App Router, Server Components
- **React 19** - UI библиотека
- **TypeScript** - Type safety
- **Tailwind CSS** - Стилизация
- **shadcn/ui** - UI компоненты
- **recharts** - Графики и визуализация

### Backend
- **Next.js API Routes** - RESTful API
- **Prisma ORM** - Type-safe database access
- **NextAuth.js** - Аутентификация
- **Zod** - Валидация данных

### Database
- **PostgreSQL 15+** - Основная БД

### External Services
- **grammy.js** - Telegram Bot Framework
- **Resend** - Email отправка

## 📁 Структура проекта

```
goalflow/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── migrations/            # DB migrations
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── (dashboard)/       # Protected routes
│   │   └── api/               # API routes
│   │
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── features/          # Feature components
│   │   └── layout/            # Layout components
│   │
│   └── lib/                   # Utilities & services
│       ├── services/          # Business logic
│       ├── validations/       # Zod schemas
│       ├── auth.ts            # NextAuth config
│       └── db.ts              # Prisma client
│
├── tests/                     # Tests
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # E2E tests (Playwright)
│
└── memory-bank/               # Project documentation
```

## 🧪 Тестирование

### Unit & Integration Tests
```bash
# Запустить все тесты
npm run test

# Запустить тесты один раз
npm run test:run

# Запустить тесты в watch mode
npm test
```

### E2E Tests (Playwright)
```bash
# Запустить E2E тесты
npm run test:e2e

# Запустить с UI
npm run test:e2e:ui
```

## 📝 Скрипты

- `npm run dev` - Запуск dev server
- `npm run build` - Production build
- `npm run start` - Запуск production server
- `npm run lint` - Проверка кода
- `npm run test` - Запуск unit/integration тестов
- `npm run test:run` - Запуск тестов один раз
- `npm run test:e2e` - Запуск E2E тестов
- `npm run test:e2e:ui` - Запуск E2E тестов с UI
- `npm run db:seed` - Заполнение БД тестовыми данными

## 🔐 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/goalflow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Telegram (опционально)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_SECRET="your-webhook-secret"

# Email (опционально)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

## 📚 Документация

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектурный план проекта
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Отчет по безопасности
- [SECURITY.md](./SECURITY.md) - Рекомендации по безопасности
- [TESTING_PLAN.md](./TESTING_PLAN.md) - План тестирования проекта
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Руководство для контрибьюторов
- [memory-bank/](./memory-bank/) - Документация разработки

## 🤝 Вклад в проект

Мы приветствуем вклад в проект! Пожалуйста, ознакомьтесь с [CONTRIBUTING.md](./CONTRIBUTING.md) для получения подробных инструкций.

**Быстрый старт:**
1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

**Нужна помощь?**
- Откройте [Issue](https://github.com/timokay/GoalFlow/issues) для багов или предложений
- Изучите [Issues с меткой "good first issue"](https://github.com/timokay/GoalFlow/labels/good%20first%20issue) для начала работы

## 📄 Лицензия

Этот проект находится под лицензией MIT.

## 👥 Авторы

- **Timofey** - [GitHub](https://github.com/timokay)

---

**Примечание:** Проект находится в активной разработке. Некоторые функции могут быть нестабильными.
