import { NextResponse } from 'next/server';
import { RateLimiter } from '../utils/security';

// Создаем отдельные rate limiters для разных типов запросов
const authRateLimiter = new RateLimiter(5, 60000); // 5 запросов в минуту для auth
const apiRateLimiter = new RateLimiter(100, 60000); // 100 запросов в минуту для API
const searchRateLimiter = new RateLimiter(30, 60000); // 30 запросов в минуту для поиска

export function getRateLimiter(type: 'auth' | 'api' | 'search'): RateLimiter {
  switch (type) {
    case 'auth':
      return authRateLimiter;
    case 'search':
      return searchRateLimiter;
    default:
      return apiRateLimiter;
  }
}

export function withRateLimit(
  handler: (req: Request, context: any) => Promise<Response>,
  type: 'auth' | 'api' | 'search' = 'api',
) {
  return async (req: Request, context: any) => {
    const identifier = req.headers.get('x-forwarded-for') || 'unknown';
    const limiter = getRateLimiter(type);

    if (!limiter.isAllowed(identifier)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    return handler(req, context);
  };
}

