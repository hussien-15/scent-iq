import { prisma } from '@/lib/prisma';
import { CARD_MAIN_MEDIA_SELECT, CARD_MEDIA_SELECT } from '@/lib/product-card';

const BRAND_SELECT = { select: { name: true, nameAr: true } } as const;

/**
 * Customers Also Viewed — co-occurrence across *signed-in* users' view
 * history. Most storefront views are anonymous (no account), so this will
 * mostly come back empty on a fresh install — that's honest, not broken:
 * the query is real and will surface real co-occurrence once there's
 * enough logged-in browsing history to compute it from.
 */
export async function getCustomersAlsoViewed(perfumeId: string, take = 4) {
  const viewers = await prisma.userInteraction.findMany({
    where: { perfumeId, actionType: 'VIEW', userId: { not: null } },
    select: { userId: true },
    distinct: ['userId'],
  });
  const viewerIds = viewers.map((v: { userId: string | null }) => v.userId).filter(Boolean) as string[];
  if (viewerIds.length === 0) return [];

  const coViews = await prisma.userInteraction.groupBy({
    by: ['perfumeId'],
    where: {
      userId: { in: viewerIds },
      actionType: 'VIEW',
      perfumeId: { not: perfumeId },
    },
    _count: { perfumeId: true },
    orderBy: { _count: { perfumeId: 'desc' } },
    take,
  });

  if (coViews.length === 0) return [];

  const ids = coViews.map((c: { perfumeId: string }) => c.perfumeId);
  return prisma.perfume.findMany({
    where: { id: { in: ids }, status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
    include: { brand: BRAND_SELECT, mainImage: CARD_MAIN_MEDIA_SELECT, media: CARD_MEDIA_SELECT },
  });
}

/** Perfumes with the most interaction volume in the last `days` days. */
export async function getTrending(days = 14, take = 4) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const counts = await prisma.userInteraction.groupBy({
    by: ['perfumeId'],
    where: { createdAt: { gte: since } },
    _count: { perfumeId: true },
    orderBy: { _count: { perfumeId: 'desc' } },
    take,
  });

  if (counts.length === 0) return [];

  const ids = counts.map((c: { perfumeId: string }) => c.perfumeId);
  const perfumes = await prisma.perfume.findMany({
    where: { id: { in: ids }, status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
    include: { brand: BRAND_SELECT, mainImage: CARD_MAIN_MEDIA_SELECT, media: CARD_MEDIA_SELECT },
  });
  // Preserve the trending order (findMany's `in` doesn't guarantee it).
  const order = new Map<string, number>(ids.map((id: string, i: number) => [id, i]));
  return perfumes.sort(
    (a: { id: string }, b: { id: string }) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );
}

/** Current real-world season, for a homepage "Seasonal Picks" default. */
export function getCurrentSeason(date = new Date()): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export async function getSeasonalPicks(season: string, take = 4) {
  return prisma.perfume.findMany({
    where: { status: 'PUBLISHED', availability: { not: 'HIDDEN' }, season: { has: season } },
    take,
    include: { brand: BRAND_SELECT, mainImage: CARD_MAIN_MEDIA_SELECT, media: CARD_MEDIA_SELECT },
  });
}

/**
 * Hidden Gems — well-rated but under-discovered. A perfume needs at least
 * one approved review averaging 4+ to qualify; among those, the
 * least-viewed surface first. With a 6-product demo catalog this will
 * often just be "the un-reviewed ones don't count" — the logic holds at
 * any catalog size, it just needs enough reviews to be interesting.
 */
export async function getHiddenGems(take = 4) {
  const candidates = await prisma.perfume.findMany({
    where: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
    include: {
      brand: BRAND_SELECT,
      mainImage: CARD_MAIN_MEDIA_SELECT,
      media: CARD_MEDIA_SELECT,
      reviews: { where: { approvalStatus: 'APPROVED' }, select: { rating: true } },
    },
  });

  return candidates
    .map((p: { reviews: { rating: number }[]; viewCount: number }) => ({
      ...p,
      avgRating: p.reviews.length
        ? p.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / p.reviews.length
        : 0,
    }))
    .filter((p: { avgRating: number }) => p.avgRating >= 4)
    .sort((a: { viewCount: number }, b: { viewCount: number }) => a.viewCount - b.viewCount)
    .slice(0, take);
}

/** Named filter presets — the spec's "Smart Discovery Carousels." */
export const DISCOVERY_CAROUSELS = {
  'perfect-for-summer': { season: 'summer' },
  'office-essentials': { occasion: 'office' },
  'best-date-night': { occasion: 'date' },
  'fresh-everyday': { scentFamily: 'fresh', occasion: 'daily' },
  'long-lasting-favorites': { minLongevity: 'HIGH' },
} as const;

export type CarouselKey = keyof typeof DISCOVERY_CAROUSELS;

export async function getDiscoveryCarousel(key: CarouselKey, take = 4) {
  const filter = DISCOVERY_CAROUSELS[key];
  const where: Record<string, unknown> = { status: 'PUBLISHED', availability: { not: 'HIDDEN' } };

  if ('season' in filter) where.season = { has: filter.season };
  if ('occasion' in filter) where.occasion = { has: filter.occasion };
  if ('scentFamily' in filter) where.scentFamilies = { has: filter.scentFamily };
  if ('minLongevity' in filter) where.longevity = { in: ['HIGH', 'VERY_HIGH'] };

  return prisma.perfume.findMany({ where, take, include: { brand: BRAND_SELECT, mainImage: CARD_MAIN_MEDIA_SELECT, media: CARD_MEDIA_SELECT } });
}
