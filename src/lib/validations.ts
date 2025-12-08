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

// Metric schemas
export const createMetricSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  currentValue: z.number().min(0).optional(),
  targetValue: z.number().min(0, 'Target value must be positive'),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit is too long'),
  goalId: z.string().cuid('Invalid goal ID'),
});

export const updateMetricSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    currentValue: z.number().min(0).optional(),
    targetValue: z.number().min(0).optional(),
    unit: z.string().min(1).max(20).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update');

// Workspace schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

export const updateWorkspaceSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update');

export const addWorkspaceMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional(),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateMetricInput = z.infer<typeof createMetricSchema>;
export type UpdateMetricInput = z.infer<typeof updateMetricSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
export type UpdateWorkspaceMemberInput = z.infer<typeof updateWorkspaceMemberSchema>;
