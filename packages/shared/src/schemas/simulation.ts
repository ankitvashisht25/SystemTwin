import { z } from 'zod';

export const startSimulationSchema = z.object({
  architecture: z.object({
    id: z.string(),
    name: z.string(),
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
  config: z.object({
    trafficLevel: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    trafficPattern: z.enum(['steady', 'ramp', 'spike', 'wave']).optional(),
    tickRate: z.number().positive().optional(),
  }).optional(),
});

export const injectFailureSchema = z.object({
  nodeId: z.string().min(1),
  type: z.enum(['crash', 'latency', 'partition', 'resource-exhaustion']),
});

export const removeFailureSchema = z.object({
  failureId: z.string().min(1),
});
