import { z } from 'zod';

/**
 * Shared validation for product create/update — used by Perfume Studio's
 * forms (React Hook Form's zodResolver) and, later, the REST API route
 * handlers, so "invalid price" or "negative stock" is rejected the same way
 * everywhere instead of re-implemented per form/endpoint.
 */
export const productSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  brandId: z.string().uuid('Select a brand'),
  categoryId: z.string().uuid().optional(),

  costPrice: z.number().nonnegative().optional(),
  price: z.number().positive('Price must be greater than 0'),
  oldPrice: z.number().positive().optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  currency: z.string().length(3).default('USD'),

  stock: z.number().int().nonnegative('Stock cannot be negative'),
  reservedStock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),

  descriptionEn: z.string().min(1, 'English description is required'),
  descriptionAr: z.string().min(1, 'Arabic description is required'),
  shortDescriptionEn: z.string().optional(),
  shortDescriptionAr: z.string().optional(),

  concentration: z.string().optional(),
  gender: z.enum(['MASCULINE', 'FEMININE', 'UNISEX']),
  bottleSize: z.string().optional(),
  releaseYear: z.number().int().min(1900).max(2100).optional(),
  countryOfOrigin: z.string().optional(),
  scentFamilies: z.array(z.string()).min(1, 'Pick at least one scent family'),

  season: z.array(z.string()).default([]),
  occasion: z.array(z.string()).default([]),
  style: z.array(z.string()).default([]),
  mood: z.array(z.string()).default([]),

  metaTitleEn: z.string().optional(),
  metaTitleAr: z.string().optional(),
  metaDescriptionEn: z.string().optional(),
  metaDescriptionAr: z.string().optional(),
  keywords: z.array(z.string()).default([]),
})
  // "Old price" only makes sense as a value *higher* than the current price.
  .refine((data) => data.oldPrice == null || data.oldPrice > data.price, {
    message: 'Old price must be greater than the current price',
    path: ['oldPrice'],
  });

export type ProductInput = z.infer<typeof productSchema>;
