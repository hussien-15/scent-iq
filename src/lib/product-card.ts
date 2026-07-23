import type { Prisma } from '@prisma/client';

/**
 * The exact storefront card payload. Keeping this selection centralized stops
 * listing pages from transferring descriptions, SEO fields, galleries, stock
 * history, and other product-detail data that a card cannot render.
 */
export const PRODUCT_CARD_SELECT = {
  id: true,
  slug: true,
  nameEn: true,
  nameAr: true,
  price: true,
  oldPrice: true,
  availability: true,
  availableStock: true,
  lowStockThreshold: true,
  concentration: true,
  scentFamilies: true,
  brand: { select: { name: true, nameAr: true } },
  _count: { select: { variants: true } },
  mainImage: { select: { url: true, altText: true, width: true, height: true } },
  media: {
    where: { type: 'IMAGE' as const },
    orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'asc' as const }],
    take: 1,
    select: { url: true, altText: true, width: true, height: true },
  },
} satisfies Prisma.PerfumeSelect;

export const CARD_MEDIA_SELECT = {
  where: { type: 'IMAGE' },
  orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  take: 1,
  select: { url: true, altText: true, width: true, height: true },
} satisfies Prisma.Perfume$mediaArgs;

export const CARD_MAIN_MEDIA_SELECT = {
  select: { url: true, altText: true, width: true, height: true },
} satisfies Prisma.Perfume$mainImageArgs;
