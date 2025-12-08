'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, Copy } from 'lucide-react';

interface TelegramLinkClientProps {
  token?: string;
}

export function TelegramLinkClient({ token }: TelegramLinkClientProps) {
  const searchParams = useSearchParams();
  const [telegramId, setTelegramId] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Если есть токен в URL, можно его использовать для верификации
    const urlToken = searchParams.get('token');
    if (urlToken) {
      // Декодируем токен для получения telegramId
      try {
        const decoded = Buffer.from(urlToken, 'base64').toString('utf-8');
        const [id] = decoded.split(':');
        setTelegramId(id);
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, [searchParams]);

  const handleLink = async () => {
    if (!telegramId.trim()) {
      setError('Введите ваш Telegram ID');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const response = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to link account');
      }

      setIsLinked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link account');
    } finally {
      setIsLinking(false);
    }
  };

  const copyTelegramId = () => {
    navigator.clipboard.writeText(telegramId);
  };

  if (isLinked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telegram Integration</h1>
          <p className="text-muted-foreground">Свяжите ваш Telegram аккаунт с GoalFlow</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Аккаунт успешно привязан!
            </CardTitle>
            <CardDescription>Ваш Telegram аккаунт связан с GoalFlow</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Теперь вы можете использовать Telegram бота для получения уведомлений и управления
              целями.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Telegram ID: {telegramId}</p>
              <p className="text-sm text-muted-foreground">
                Используйте команды в боте: /start, /goals, /report
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Telegram Integration</h1>
        <p className="text-muted-foreground">Свяжите ваш Telegram аккаунт с GoalFlow</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Привязка Telegram аккаунта</CardTitle>
          <CardDescription>
            Получите ваш Telegram ID и введите его ниже для привязки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telegramId">Telegram ID</Label>
            <div className="flex gap-2">
              <Input
                id="telegramId"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="123456789"
                className={error ? 'border-destructive' : ''}
              />
              {telegramId && (
                <Button variant="outline" size="icon" onClick={copyTelegramId}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Как получить Telegram ID:
              <br />
              1. Откройте Telegram бота @userinfobot
              <br />
              2. Отправьте команду /start
              <br />
              3. Скопируйте ваш ID и вставьте выше
            </p>
          </div>

          <Button onClick={handleLink} disabled={isLinking || !telegramId.trim()}>
            {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Привязать аккаунт
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

