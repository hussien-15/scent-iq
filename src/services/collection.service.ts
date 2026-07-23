import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CARD_MAIN_MEDIA_SELECT, CARD_MEDIA_SELECT } from '@/lib/product-card';

export const COLLECTION_FAMILIES = ['oriental', 'fresh', 'woody', 'floral', 'aquatic', 'oud'] as const;
export const COLLECTION_SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export const COLLECTION_OCCASIONS = ['office', 'daily', 'date', 'wedding', 'formal', 'casual', 'night', 'travel'] as const;
export const COLLECTION_STYLES = ['elegant', 'luxury', 'fresh', 'sweet', 'dark', 'modern', 'classic'] as const;
export const PERFORMANCE_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'] as const;

export type CollectionRules = {
  brandIds?: string[];
  genders?: Array<'MASCULINE' | 'FEMININE' | 'UNISEX'>;
  priceMin?: number;
  priceMax?: number;
  scentFamilies?: string[];
  seasons?: string[];
  occasions?: string[];
  styles?: string[];
  noteIds?: string[];
  longevity?: Array<'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'>;
  projection?: Array<'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'>;
  sillage?: Array<'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'>;
  availability?: Array<'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'DISCONTINUED'>;
  discounted?: boolean;
  newArrivals?: boolean;
  bestSellers?: boolean;
  trending?: boolean;
  lowStock?: boolean;
  mostViewed?: boolean;
  mostWishlisted?: boolean;
};

export type CollectionFilters = {
  brand?: string;
  gender?: string;
  family?: string;
  season?: string;
  occasion?: string;
  note?: string;
  longevity?: string;
  projection?: string;
  sillage?: string;
  availability?: string;
  discount?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

type CollectionForProducts = {
  id: string;
  type: 'MANUAL' | 'DYNAMIC' | 'HYBRID';
  rules: Prisma.JsonValue | null;
  manualOrdering: boolean;
  perfumes: Array<{
    perfumeId: string;
    position: number;
    pinned: boolean;
    featuredLabelEn: string | null;
    featuredLabelAr: string | null;
    featuredReasonEn: string | null;
    featuredReasonAr: string | null;
  }>;
};

function collectionSourceWhere(collection: CollectionForProducts): Prisma.PerfumeWhereInput {
  const rules = parseCollectionRules(collection.rules);
  const manualIds = collection.perfumes.map((item) => item.perfumeId);

  if (collection.type === 'MANUAL') return { id: { in: manualIds } };
  if (collection.type === 'HYBRID') {
    return { OR: [dynamicWhere(rules), { id: { in: manualIds } }] };
  }
  return dynamicWhere(rules);
}

const PRODUCT_INCLUDE = {
  brand: { select: { name: true, nameAr: true } },
  mainImage: CARD_MAIN_MEDIA_SELECT,
  media: CARD_MEDIA_SELECT,
  reviews: { where: { approvalStatus: 'APPROVED' as const }, select: { rating: true } },
  variants: { where: { availability: { not: 'HIDDEN' as const } }, select: { stock: true, reservedStock: true, availability: true } },
} as const;

function isRecord(value: Prisma.JsonValue | null): value is Prisma.JsonObject {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function parseCollectionRules(value: Prisma.JsonValue | null): CollectionRules {
  if (!isRecord(value)) return {};
  return value as unknown as CollectionRules;
}

function dynamicWhere(rules: CollectionRules): Prisma.PerfumeWhereInput {
  const where: Prisma.PerfumeWhereInput = {};

  if (rules.brandIds?.length) where.brandId = { in: rules.brandIds };
  if (rules.genders?.length) where.gender = { in: rules.genders };
  if (rules.scentFamilies?.length) where.scentFamilies = { hasSome: rules.scentFamilies };
  if (rules.seasons?.length) where.season = { hasSome: rules.seasons };
  if (rules.occasions?.length) where.occasion = { hasSome: rules.occasions };
  if (rules.styles?.length) where.style = { hasSome: rules.styles };
  if (rules.noteIds?.length) where.notes = { some: { noteId: { in: rules.noteIds } } };
  if (rules.longevity?.length) where.longevity = { in: rules.longevity };
  if (rules.projection?.length) where.projection = { in: rules.projection };
  if (rules.sillage?.length) where.sillage = { in: rules.sillage };
  if (rules.availability?.length) where.availability = { in: rules.availability };
  if (rules.priceMin != null || rules.priceMax != null) {
    where.price = { gte: rules.priceMin, lte: rules.priceMax };
  }
  if (rules.discounted) where.oldPrice = { not: null };
  if (rules.bestSellers) where.purchaseCount = { gt: 0 };
  if (rules.trending) where.popularityScore = { gt: 0 };
  if (rules.lowStock) where.inventoryStatus = 'LOW_STOCK';
  if (rules.mostViewed) where.viewCount = { gt: 0 };
  if (rules.mostWishlisted) where.wishlistCount = { gt: 0 };
  if (rules.newArrivals) {
    const since = new Date();
    since.setDate(since.getDate() - 45);
    where.createdAt = { gte: since };
  }

  return where;
}

function selectedFilterWhere(filters: CollectionFilters): Prisma.PerfumeWhereInput {
  const where: Prisma.PerfumeWhereInput = {};
  const genders = ['MASCULINE', 'FEMININE', 'UNISEX'];
  const availability = ['IN_STOCK', 'OUT_OF_STOCK', 'PREORDER', 'DISCONTINUED'];

  if (filters.brand) where.brandId = filters.brand;
  if (filters.gender && genders.includes(filters.gender)) {
    where.gender = filters.gender as 'MASCULINE' | 'FEMININE' | 'UNISEX';
  }
  if (filters.family) where.scentFamilies = { has: filters.family };
  if (filters.season) where.season = { has: filters.season };
  if (filters.occasion) where.occasion = { has: filters.occasion };
  if (filters.note) where.notes = { some: { noteId: filters.note } };
  if (filters.longevity && PERFORMANCE_LEVELS.includes(filters.longevity as (typeof PERFORMANCE_LEVELS)[number])) {
    where.longevity = filters.longevity as (typeof PERFORMANCE_LEVELS)[number];
  }
  if (filters.projection && PERFORMANCE_LEVELS.includes(filters.projection as (typeof PERFORMANCE_LEVELS)[number])) {
    where.projection = filters.projection as (typeof PERFORMANCE_LEVELS)[number];
  }
  if (filters.sillage && PERFORMANCE_LEVELS.includes(filters.sillage as (typeof PERFORMANCE_LEVELS)[number])) {
    where.sillage = filters.sillage as (typeof PERFORMANCE_LEVELS)[number];
  }
  if (filters.availability && availability.includes(filters.availability)) {
    where.availability = filters.availability as 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'DISCONTINUED';
  }
  if (filters.discount === 'true') where.oldPrice = { not: null };

  const min = filters.minPrice?.trim() ? Number(filters.minPrice) : Number.NaN;
  const max = filters.maxPrice?.trim() ? Number(filters.maxPrice) : Number.NaN;
  if (Number.isFinite(min) || Number.isFinite(max)) {
    where.price = {
      ...(Number.isFinite(min) ? { gte: min } : {}),
      ...(Number.isFinite(max) ? { lte: max } : {}),
    };
  }

  return where;
}

function performanceScore(value: string | null) {
  return value ? PERFORMANCE_LEVELS.indexOf(value as (typeof PERFORMANCE_LEVELS)[number]) : -1;
}

export async function getCollectionProducts(
  collection: CollectionForProducts,
  filters: CollectionFilters,
  pageSize = 12
) {
  const rules = parseCollectionRules(collection.rules);
  const products = await prisma.perfume.findMany({
    where: {
      AND: [{ status: 'PUBLISHED', availability: { not: 'HIDDEN' } }, collectionSourceWhere(collection), selectedFilterWhere(filters)],
    },
    include: PRODUCT_INCLUDE,
    take: 500,
  });

  const manual = new Map(collection.perfumes.map((item) => [item.perfumeId, item]));
  const withEditorial = products.map((product) => ({
    ...product,
    avgRating: product.reviews.length
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : null,
    collectionPlacement: manual.get(product.id) ?? null,
  }));

  const sort = filters.sort ?? 'featured';
  withEditorial.sort((a, b) => {
    if (sort === 'price-asc') return Number(a.price) - Number(b.price);
    if (sort === 'price-desc') return Number(b.price) - Number(a.price);
    if (sort === 'newest') return b.createdAt.getTime() - a.createdAt.getTime();
    if (sort === 'best-selling') return b.purchaseCount - a.purchaseCount;
    if (sort === 'popular') return b.popularityScore - a.popularityScore;
    if (sort === 'best-rated') return (b.avgRating ?? 0) - (a.avgRating ?? 0);
    if (sort === 'strongest') {
      const aScore = performanceScore(a.longevity) + performanceScore(a.projection) + performanceScore(a.sillage);
      const bScore = performanceScore(b.longevity) + performanceScore(b.projection) + performanceScore(b.sillage);
      return bScore - aScore;
    }

    if (rules.bestSellers) return b.purchaseCount - a.purchaseCount;
    if (rules.mostViewed) return b.viewCount - a.viewCount;
    if (rules.mostWishlisted) return b.wishlistCount - a.wishlistCount;
    if (rules.trending) return b.popularityScore - a.popularityScore;

    if (collection.manualOrdering) {
      const aPlacement = a.collectionPlacement;
      const bPlacement = b.collectionPlacement;
      if (aPlacement?.pinned !== bPlacement?.pinned) return aPlacement?.pinned ? -1 : 1;
      return (aPlacement?.position ?? 9999) - (bPlacement?.position ?? 9999);
    }
    return b.popularityScore - a.popularityScore;
  });

  const featured = withEditorial
    .filter((item) => item.collectionPlacement?.pinned || item.collectionPlacement?.featuredReasonEn || item.collectionPlacement?.featuredReasonAr)
    .slice(0, 6);
  const fallbackFeatured = featured.length > 0 ? featured : withEditorial.slice(0, 4);
  const page = Math.max(1, Number.parseInt(filters.page ?? '1', 10) || 1);
  const total = withEditorial.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    products: withEditorial.slice((safePage - 1) * pageSize, safePage * pageSize),
    featured: fallbackFeatured,
    total,
    page: safePage,
    totalPages,
  };
}

export async function countCollectionProducts(collection: CollectionForProducts) {
  return prisma.perfume.count({
    where: { AND: [{ status: 'PUBLISHED', availability: { not: 'HIDDEN' } }, collectionSourceWhere(collection)] },
  });
}

export function publicCollectionWhere(now = new Date()): Prisma.CollectionWhereInput {
  return {
    OR: [
      { status: 'PUBLISHED' },
      { status: 'SCHEDULED', scheduledAt: { lte: now } },
    ],
  };
}

/**
 * Converts a signed-in customer's collection browsing into preference signals.
 * The recommendation engine can use these without guessing from a collection
 * title: it reads the actual dynamic rules the editor configured.
 */
export async function getCollectionPreferenceSignals(userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const interactions = await prisma.collectionInteraction.findMany({
    where: { userId, createdAt: { gte: since } },
    take: 100,
    orderBy: { createdAt: 'desc' },
    select: { actionType: true, collection: { select: { rules: true } } },
  });
  const scores = {
    families: new Map<string, number>(),
    seasons: new Map<string, number>(),
    occasions: new Map<string, number>(),
    brands: new Map<string, number>(),
  };
  const weights = { VIEW: 1, PRODUCT_CLICK: 2, ADD_TO_CART: 3, PURCHASE: 5 } as const;

  function add(map: Map<string, number>, values: string[] | undefined, weight: number) {
    values?.forEach((value) => map.set(value, (map.get(value) ?? 0) + weight));
  }

  interactions.forEach((interaction) => {
    const rules = parseCollectionRules(interaction.collection.rules);
    const weight = weights[interaction.actionType];
    add(scores.families, rules.scentFamilies, weight);
    add(scores.seasons, rules.seasons, weight);
    add(scores.occasions, rules.occasions, weight);
    add(scores.brands, rules.brandIds, weight);
  });

  const top = (map: Map<string, number>, take = 3) =>
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, take).map(([value]) => value);

  return {
    families: top(scores.families),
    seasons: top(scores.seasons),
    occasions: top(scores.occasions),
    brandIds: top(scores.brands),
  };
}
