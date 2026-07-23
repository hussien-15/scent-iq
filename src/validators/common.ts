import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function safeSortSchema<const T extends readonly [string, ...string[]]>(allowed: T, fallback: T[number]) {
  return z.enum(allowed).catch(fallback);
}

export const searchSuggestionSchema = z.object({
  q: z.string().trim().max(80).default(''),
  limit: z.coerce.number().int().min(1).max(10).default(6),
});

export const idListSchema = z.array(uuidSchema).max(100);
