'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createMetricSchema, updateMetricSchema } from '@/lib/validations';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

interface Metric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
}

interface EditMetricDialogProps {
  goalId: string;
  metric?: Metric;
  onClose: () => void;
  onSaved: () => void;
}

// Клиентская схема без goalId (он добавляется на сервере)
const createMetricFormSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100, 'Название слишком длинное'),
  currentValue: z.number().min(0).optional(),
  targetValue: z.number().min(0, 'Целевое значение должно быть положительным'),
  unit: z
    .string()
    .min(1, 'Единица измерения обязательна')
    .max(20, 'Единица измерения слишком длинная'),
});

type CreateMetricForm = z.infer<typeof createMetricFormSchema>;
type UpdateMetricForm = z.infer<typeof updateMetricSchema>;

export function EditMetricDialog({ goalId, metric, onClose, onSaved }: EditMetricDialogProps) {
  const isEditing = !!metric;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateMetricForm | UpdateMetricForm>({
    resolver: zodResolver(isEditing ? updateMetricSchema : createMetricFormSchema),
    defaultValues: metric
      ? {
          name: metric.name,
          currentValue: metric.currentValue,
          targetValue: metric.targetValue,
          unit: metric.unit,
        }
      : {
          name: '',
          currentValue: 0,
          targetValue: 0,
          unit: '',
        },
  });

  useEffect(() => {
    if (metric) {
      reset({
        name: metric.name,
        currentValue: metric.currentValue,
        targetValue: metric.targetValue,
        unit: metric.unit,
      });
    }
  }, [metric, reset]);

  async function onSubmit(data: CreateMetricForm | UpdateMetricForm) {
    console.log('[EditMetricDialog] onSubmit called', { data, isEditing, goalId });
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/metrics/${metric.id}` : `/api/goals/${goalId}/metrics`;
      const method = isEditing ? 'PATCH' : 'POST';

      // Добавляем goalId для создания метрики
      const payload = isEditing ? data : { ...data, goalId };
      console.log('[EditMetricDialog] Sending payload', { url, method, payload });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[EditMetricDialog] Response status', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[EditMetricDialog] Error response', errorData);
        throw new Error(errorData.error?.message || errorData.error || 'Failed to save metric');
      }

      const result = await response.json();
      console.log('[EditMetricDialog] Success', result);
      onSaved();
    } catch (err) {
      console.error('[EditMetricDialog] Error', err);
      setError(err instanceof Error ? err.message : 'Failed to save metric');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFormSubmit = handleSubmit(onSubmit, (errors) => {
    console.log('[EditMetricDialog] Validation errors', errors);
  });

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('[EditMetricDialog] Button clicked', { errors });
    handleFormSubmit(e as any);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Редактировать метрику' : 'Добавить метрику'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Обновите информацию о метрике'
              : 'Создайте новую метрику для отслеживания прогресса цели'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Например: Количество пользователей"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentValue">Текущее значение</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.1"
                {...register('currentValue', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' || isNaN(Number(v)) ? 0 : Number(v)),
                })}
                placeholder="0"
              />
              {errors.currentValue && (
                <p className="text-sm text-destructive">{errors.currentValue.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetValue">Целевое значение *</Label>
              <Input
                id="targetValue"
                type="number"
                step="0.1"
                {...register('targetValue', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' || isNaN(Number(v)) ? 0 : Number(v)),
                })}
                placeholder="100"
              />
              {errors.targetValue && (
                <p className="text-sm text-destructive">{errors.targetValue.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Единица измерения *</Label>
            <Input id="unit" {...register('unit')} placeholder="Например: шт, %, руб" />
            {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Отладочная информация */}
          {Object.keys(errors).length > 0 && (
            <div className="text-xs text-destructive">
              Ошибки валидации: {JSON.stringify(errors, null, 2)}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={(e) => {
                console.log('[EditMetricDialog] Submit button clicked');
              }}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
