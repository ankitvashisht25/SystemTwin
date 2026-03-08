import { z } from 'zod';

export const createArchitectureSchema = z.object({
  name: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export const updateArchitectureSchema = z.object({
  name: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  thumbnail: z.string().optional(),
});
