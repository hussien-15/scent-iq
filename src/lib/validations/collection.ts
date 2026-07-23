import { z } from 'zod';

const optionalUrl = z.union([z.literal(''), z.string().url('Enter a complete https:// URL')]);

export const collectionSchema = z
  .object({
    name: z.string().min(2, 'English name is required'),
    nameAr: z.string().min(2, 'Arabic name is required'),
    slug: z
      .string()
      .min(2, 'Slug is required')
      .regex(/^[a-z0-9-]+$/, 'Use lowercase English letters, numbers, and hyphens only'),
    type: z.enum(['MANUAL', 'DYNAMIC', 'HYBRID']),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'SCHEDULED']),
    shortDescription: z.string().max(240).optional(),
    shortDescriptionAr: z.string().max(240).optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    buyingGuide: z.string().optional(),
    buyingGuideAr: z.string().optional(),
    coverImage: optionalUrl,
    coverAlt: z.string().optional(),
    coverAltAr: z.string().optional(),
    ogImage: optionalUrl,
    metaTitleEn: z.string().max(70).optional(),
    metaTitleAr: z.string().max(70).optional(),
    metaDescriptionEn: z.string().max(170).optional(),
    metaDescriptionAr: z.string().max(170).optional(),
    scheduledAt: z.string().optional(),
    homepageOrder: z.number().int().nonnegative(),
  })
  .refine((data) => data.status !== 'SCHEDULED' || Boolean(data.scheduledAt), {
    message: 'Choose a publication date for a scheduled collection',
    path: ['scheduledAt'],
  });

export type CollectionFormInput = z.infer<typeof collectionSchema>;
