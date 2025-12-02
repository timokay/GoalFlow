import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Goal schemas
const baseGoalSchema = {
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  type: z.enum(['QUARTERLY', 'MONTHLY', 'WEEKLY']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  parentId: z.string().cuid().optional(),
  workspaceId: z.string().cuid(),
  progress: z.number().int().min(0).max(100).optional(),
};

export const createGoalSchema = z
  .object({
    ...baseGoalSchema,
    status: z.undefined(),
    progress: z.undefined(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endDate'],
      });
    }
    if (data.type === 'WEEKLY' && data.parentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weekly goals cannot have parent goals',
        path: ['parentId'],
      });
    }
  });

export const updateGoalSchema = z
  .object({
    title: baseGoalSchema.title.optional(),
    description: baseGoalSchema.description,
    status: baseGoalSchema.status,
    type: baseGoalSchema.type.optional(),
    startDate: baseGoalSchema.startDate.optional(),
    endDate: baseGoalSchema.endDate.optional(),
    parentId: baseGoalSchema.parentId,
    workspaceId: baseGoalSchema.workspaceId.optional(),
    progress: baseGoalSchema.progress,
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endDate'],
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
