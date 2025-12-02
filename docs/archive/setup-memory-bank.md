# Memory Bank Setup для GoalFlow

## Вариант 1: Supercode.sh

### Установка
```bash
# Установка supercode.sh (если еще не установлен)
curl -sSL https://supercode.sh/install | bash
```

### Добавление Memory Bank плагина
```bash
# Установка плагина Memory Bank
supercode install memory-bank
```

### Конфигурация
Создайте или обновите `supercode.config.json`:

```json
{
  "plugins": {
    "memory-bank": {
      "enabled": true,
      "settings": {
        "storageType": "local",
        "maxMemorySize": "1GB",
        "indexing": true,
        "searchEnabled": true,
        "contextWindow": 8000
      }
    }
  },
  "project": {
    "name": "GoalFlow",
    "type": "nextjs",
    "framework": "typescript"
  },
  "memory": {
    "codebase": {
      "scan": ["src/**/*.{ts,tsx,js,jsx}", "prisma/**/*.prisma"],
      "ignore": ["node_modules", ".next", "dist"]
    },
    "documentation": {
      "scan": ["docs/**/*.md", "README*.md", "*.md"]
    },
    "architecture": {
      "scan": ["ARCHITECTURE_PLAN.md", "PROFESSIONAL_ASSESSMENT.md"]
    }
  }
}
```

## Вариант 2: Создание собственного Memory Bank

Если supercode.sh недоступен, можно создать собственную систему:

### 1. Структура Memory Bank

```
memory-bank/
├── codebase/           # Индексированный код
├── documentation/      # Документация проекта
├── patterns/          # Паттерны и best practices
├── context/           # Контекстная информация
└── index.json         # Индексный файл
```

### 2. Скрипт инициализации

```bash
#!/bin/bash
# init-memory-bank.sh

mkdir -p memory-bank/{codebase,documentation,patterns,context}

# Индексация кода
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  echo "Indexing: $file"
  cp "$file" "memory-bank/codebase/"
done

# Копирование документации
cp ARCHITECTURE_PLAN.md memory-bank/documentation/
cp PROFESSIONAL_ASSESSMENT.md memory-bank/documentation/
cp README_SUMMARY.md memory-bank/documentation/

# Создание индекса
cat > memory-bank/index.json << 'JSON'
{
  "project": "GoalFlow",
  "version": "1.0",
  "indexed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "components": {
    "codebase": "TypeScript/React codebase",
    "documentation": "Project documentation",
    "patterns": "Development patterns",
    "context": "Project context"
  }
}
JSON

echo "Memory Bank initialized!"
```

### 3. Context файлы для AI

```typescript
// memory-bank/context/project-context.ts
export const PROJECT_CONTEXT = {
  name: "GoalFlow",
  description: "Corporate goals management system",
  architecture: "Next.js 14 with TypeScript",
  database: "PostgreSQL with Prisma",
  testing: "Vitest + Playwright + React Testing Library",
  deployment: "Vercel + Supabase",
  
  // Ключевые концепции
  concepts: {
    goalHierarchy: "Parent-child relationship between goals",
    progressRollup: "Cascading progress updates",
    workspaceIsolation: "Multi-tenant through workspaces",
    telegramIntegration: "Bot for notifications and reports"
  },
  
  // Критические моменты из анализа
  criticalPoints: {
    performance: "Use materialized path for hierarchy",
    testing: "Comprehensive test coverage with mocks",
    security: "Rate limiting and input validation",
    scalability: "Queue-based processing for Telegram"
  },
  
  // Готовые компоненты
  readyComponents: {
    mockData: "Comprehensive mock data available",
    testingStrategy: "Full testing pyramid implemented",
    dbSchema: "Prisma schema with proper relations",
    apiStructure: "RESTful API with validation"
  }
}
```

```typescript
// memory-bank/patterns/development-patterns.ts
export const DEVELOPMENT_PATTERNS = {
  // Паттерны из анализа архитектуры
  
  // Для иерархии целей
  hierarchyPattern: {
    problem: "Deep goal hierarchy performance",
    solution: "Materialized path with level field",
    code: `
      model Goal {
        id String @id @default(cuid())
        path String? // "parent/child/grandchild"
        level Int @default(0)
        parentId String?
        parent Goal? @relation("GoalHierarchy", fields: [parentId], references: [id])
        children Goal[] @relation("GoalHierarchy")
      }
    `,
    benchmark: "Improves query time from 2000ms to 10ms"
  },
  
  // Для обновления прогресса
  progressUpdatePattern: {
    problem: "Cascading progress updates",
    solution: "Transaction-based batch updates",
    code: `
      export async function updateGoalProgress(goalId: string, progress: number) {
        return await prisma.$transaction(async (tx) => {
          await tx.goal.update({ where: { id: goalId }, data: { progress } })
          
          const goal = await tx.goal.findUnique({
            where: { id: goalId },
            select: { path: true }
          })
          
          if (goal?.path) {
            const parentIds = goal.path.split('/').slice(0, -1)
            await Promise.all(parentIds.map(updateParentProgress))
          }
        })
      }
    `
  },
  
  // Для тестирования
  testingPattern: {
    structure: "Unit (60%) + Integration (30%) + E2E (10%)",
    mockData: "Realistic test data with relationships",
    tools: "Vitest + React Testing Library + Playwright"
  }
}
```

### 4. AI Prompts для Memory Bank

```typescript
// memory-bank/context/ai-prompts.ts
export const AI_PROMPTS = {
  contextPrompt: `
    You are working on GoalFlow - a corporate goals management system.
    
    Key context:
    - Architecture: Next.js 14 + TypeScript + Prisma + PostgreSQL
    - Testing: Comprehensive strategy with mock data ready
    - Performance: Use materialized path for goal hierarchy
    - Security: Implement rate limiting and validation
    
    Always consider:
    1. Type safety (use TypeScript interfaces)
    2. Performance (materialized path for hierarchy)
    3. Testing (write tests with provided mocks)
    4. Security (validate all inputs)
    
    Available resources:
    - Mock data for all entities
    - Database schema (Prisma)
    - Testing utilities
    - Performance patterns
  `,
  
  codeGeneration: `
    When generating code for GoalFlow:
    
    1. Use existing patterns from memory bank
    2. Follow TypeScript strict mode
    3. Include proper error handling
    4. Add JSDoc comments
    5. Use provided mock data for tests
    6. Consider performance implications
    
    Example structure:
    - API routes: validation → business logic → response
    - Components: props interface → hooks → JSX
    - Services: input validation → database operations → return
  `,
  
  debugging: `
    When debugging GoalFlow issues:
    
    1. Check hierarchy performance (use materialized path)
    2. Verify progress rollup logic
    3. Test with mock data first
    4. Check database indexes
    5. Validate API responses
    
    Common issues from architecture analysis:
    - N+1 queries in hierarchy
    - Slow progress updates
    - Missing rate limiting
    - Inadequate error boundaries
  `
}
```

## Использование Memory Bank

### С Cursor AI
```json
// .cursorrules (обновленный с memory bank)
{
  "memoryBank": {
    "enabled": true,
    "contextFiles": [
      "memory-bank/context/project-context.ts",
      "memory-bank/patterns/development-patterns.ts",
      "ARCHITECTURE_PLAN.md",
      "PROFESSIONAL_ASSESSMENT.md"
    ]
  },
  
  "instructions": [
    "Always reference memory bank context before generating code",
    "Use established patterns from development-patterns.ts",
    "Consider performance implications from architecture analysis",
    "Include comprehensive tests with mock data",
    "Follow security guidelines from assessment"
  ]
}
```

### Команды для обновления Memory Bank

```bash
#!/bin/bash
# update-memory-bank.sh

echo "🧠 Updating Memory Bank..."

# Переиндексация кода
echo "📁 Reindexing codebase..."
rsync -av --delete src/ memory-bank/codebase/

# Обновление документации
echo "📚 Updating documentation..."
cp *.md memory-bank/documentation/

# Создание snapshot текущего состояния
echo "📸 Creating snapshot..."
tar -czf "memory-bank-$(date +%Y%m%d-%H%M%S).tar.gz" memory-bank/

echo "✅ Memory Bank updated!"
```
