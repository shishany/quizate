import { z } from 'zod';

export const dependencyStatusSchema = z.object({
  status: z.enum(['up', 'down']),
  latencyMs: z.number().int().nonnegative(),
  error: z.string().optional(),
});

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  checks: z.object({
    db: dependencyStatusSchema,
    redis: dependencyStatusSchema,
    storage: dependencyStatusSchema,
  }),
});

export type DependencyStatus = z.infer<typeof dependencyStatusSchema>;
export type Health = z.infer<typeof healthSchema>;
