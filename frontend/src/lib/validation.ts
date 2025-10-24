import { z } from 'zod';

// Authentication form schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Time entry form schemas
export const timeEntrySchema = z.object({
  description: z.string().min(1, 'Description is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
});

export const timeEntryUpdateSchema = timeEntrySchema.partial();

// Daily plan form schemas
export const dailyPlanSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  activities: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    estimatedTime: z.number().min(1, 'Estimated time must be at least 1 minute'),
    actualTime: z.number().optional(),
    status: z.enum(['pending', 'in_progress', 'completed']),
    category: z.string().min(1, 'Category is required'),
    priority: z.enum(['low', 'medium', 'high']),
    order: z.number().min(0, 'Order must be a non-negative number'),
  })).min(1, 'At least one activity is required'),
  status: z.enum(['draft', 'active', 'completed']).optional(),
});

export const activityUpdateSchema = z.object({
  description: z.string().min(1, 'Description is required').optional(),
  estimatedTime: z.number().min(1, 'Estimated time must be at least 1 minute').optional(),
  actualTime: z.number().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  category: z.string().min(1, 'Category is required').optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  order: z.number().min(0, 'Order must be a non-negative number').optional(),
});

// Settings form schemas
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  confirmNewPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ['confirmNewPassword'],
});

// Validation utilities
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}

// Form field validation
export function validateField<T>(schema: z.ZodType<T>, value: unknown): {
  valid: boolean;
  error?: string;
} {
  const result = schema.safeParse(value);

  if (result.success) {
    return { valid: true };
  }

  return { valid: false, error: result.error.issues[0]?.message };
}

// Date validation utilities
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function isValidTimeRange(startTime: string, endTime?: string): boolean {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;

  if (isNaN(start.getTime())) return false;
  if (end && isNaN(end.getTime())) return false;
  if (end && end <= start) return false;

  return true;
}

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type TimeEntryFormData = z.infer<typeof timeEntrySchema>;
export type TimeEntryUpdateFormData = z.infer<typeof timeEntryUpdateSchema>;
export type DailyPlanFormData = z.infer<typeof dailyPlanSchema>;
export type ActivityUpdateFormData = z.infer<typeof activityUpdateSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;