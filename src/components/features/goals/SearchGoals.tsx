'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Loader2 } from 'lucide-react';
import { GoalsList } from './GoalsList';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface SearchGoalsProps {
  workspaceId: string;
}

export function SearchGoals({ workspaceId }: SearchGoalsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 500);

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Поиск целей по названию или описанию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {debouncedQuery ? (
        <SearchResults workspaceId={workspaceId} query={debouncedQuery} />
      ) : (
        <GoalsList workspaceId={workspaceId} />
      )}
    </div>
  );
}

function SearchResults({ workspaceId, query }: { workspaceId: string; query: string }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setGoals([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/goals/search?q=${encodeURIComponent(query)}&workspaceId=${workspaceId}`);
        if (!response.ok) {
          throw new Error('Failed to search goals');
        }
        const data = await response.json();
        setGoals(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search');
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, workspaceId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Поиск...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Ничего не найдено по запросу &quot;{query}&quot;
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Найдено целей: {goals.length}
      </p>
      <GoalsList workspaceId={workspaceId} initialGoals={goals} />
    </div>
  );
}

