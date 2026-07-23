import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  scoreCandidates,
  loadFeatures,
  loadBrandSimilarity,
  getSimilarityWeights,
} from './similarity.service';
import { explainRecommendation } from './explain.service';
import type { Locale } from '@/lib/i18n';
import { getCollectionPreferenceSignals } from './collection.service';
import { CARD_MAIN_MEDIA_SELECT, CARD_MEDIA_SELECT } from '@/lib/product-card';

/**
 * "You May Also Like" — Phase 3, now genuinely powered by the similarity
 * engine (see similarity.service.ts) instead of a single scentFamilies
 * filter. Candidates are narrowed by a real DB query first (same family or
 * same brand — cheap, indexed), *then* ranked in memory by the full
 * weighted scorer. Scoring the whole catalog for every product view
 * wouldn't hold up at real scale; narrowing first does.
 */
export async function getRelatedPerfumes(perfumeId: string, lang: Locale, take = 4) {
  const reference = await loadFeatures(perfumeId);
  if (!reference) return [];

  const [candidates, weights, brandSimilarity, brand] = await Promise.all([
    prisma.perfume.findMany({
      where: {
        id: { not: perfumeId },
        status: 'PUBLISHED',
        availability: { not: 'HIDDEN' },
        OR: [{ scentFamilies: { hasSome: reference.scentFamilies } }, { brandId: reference.brandId }],
      },
      include: { brand: { select: { name: true, nameAr: true } }, mainImage: CARD_MAIN_MEDIA_SELECT, media: CARD_MEDIA_SELECT, notes: { select: { noteId: true } } },
      take: 30, // candidate pool cap — plenty for a scorer to rank, not the whole table
    }),
    getSimilarityWeights(),
    loadBrandSimilarity(reference.brandId),
    prisma.brand.findUnique({ where: { id: reference.brandId }, select: { name: true, nameAr: true } }),
  ]);

  const withNoteIds = candidates.map(
    (c: (typeof candidates)[number]) => ({
      ...c,
      price: Number(c.price),
      noteIds: c.notes.map((n: { noteId: string }) => n.noteId),
    })
  );

  const ranked = scoreCandidates(reference, withNoteIds, weights, brandSimilarity).slice(0, take);

  return ranked.map((match) => ({
    perfume: match.item,
    reason: explainRecommendation(
      {
        topFactor: match.topFactor,
        reference: {
          scentFamilies: reference.scentFamilies,
          occasion: reference.occasion,
          season: reference.season,
        },
        candidate: {
          scentFamilies: match.item.scentFamilies,
          occasion: match.item.occasion,
          season: match.item.season,
        },
        brandName: brand ? (lang === 'ar' ? brand.nameAr ?? brand.name : brand.name) : undefined,
      },
      lang
    ),
  }));
}

/**
 * Higher-end alternatives — same scent family, meaningfully pricier.
 * "Meaningfully" is a 25% floor rather than strictly-greater-than, so a
 * $185 perfume doesn't count a $186 one as a legitimate step up.
 */
export async function getHigherEndAlternatives(
  perfumeId: string,
  scentFamilies: string[],
  currentPrice: number,
  take = 4
) {
  return prisma.perfume.findMany({
    where: {
      id: { not: perfumeId },
      status: 'PUBLISHED',
      availability: { not: 'HIDDEN' },
      scentFamilies: { hasSome: scentFamilies },
      price: { gte: currentPrice * 1.25 },
    },
    take,
    orderBy: { price: 'asc' },
    include: { brand: { select: { name: true, nameAr: true } }, mainImage: CARD_MAIN_MEDIA_SELECT, media: CARD_MEDIA_SELECT },
  });
}

/** Budget alternatives — the mirror image of the above. */
export async function getBudgetAlternatives(
  perfumeId: string,
  scentFamilies: string[],
  currentPrice: number,
  take = 4
) {
  return prisma.perfume.findMany({
    where: {
      id: { not: perfumeId },
      status: 'PUBLISHED',
      availability: { not: 'HIDDEN' },
      scentFamilies: { hasSome: scentFamilies },
      price: { lte: currentPrice * 0.75 },
    },
    take,
    orderBy: { price: 'desc' },
    include: { brand: { select: { name: true, nameAr: true } }, mainImage: CARD_MAIN_MEDIA_SELECT, media: CARD_MEDIA_SELECT },
  });
}

/**
 * Records a product view — both in the raw event log (UserInteraction,
 * optionally tied to a signed-in user) and the denormalized `viewCount`
 * cache on Perfume, so "Most Viewed" on brand pages has something real to
 * sort by instead of a permanent zero. Never throws: a tracking failure
 * should never break the page someone is trying to view.
 */
export async function trackView(perfumeId: string, userId?: string) {
  try {
    await prisma.$transaction([
      prisma.userInteraction.create({
        data: { perfumeId, userId, actionType: 'VIEW' },
      }),
      prisma.perfume.update({
        where: { id: perfumeId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);
  } catch {
    // Non-critical — viewing a product should never fail because logging did.
  }
}

/** Collection browsing and the saved taste profile jointly shape future picks. */
export async function getPersonalizedRecommendations(userId: string, take = 8) {
  const [signals, profile] = await Promise.all([
    getCollectionPreferenceSignals(userId),
    prisma.tasteProfile.findUnique({ where: { userId } }),
  ]);
  const families = [...new Set([...(profile?.preferredFamilies ?? []), ...signals.families])];
  const seasons = [...new Set([...(profile?.favoriteSeasons ?? []), ...signals.seasons])];
  const occasions = [...new Set([...(profile?.occasions ?? []), ...signals.occasions])];
  const filters: Prisma.PerfumeWhereInput[] = [];
  if (families.length) filters.push({ scentFamilies: { hasSome: families } });
  if (seasons.length) filters.push({ season: { hasSome: seasons } });
  if (occasions.length) filters.push({ occasion: { hasSome: occasions } });
  if (signals.brandIds.length) filters.push({ brandId: { in: signals.brandIds } });

  return prisma.perfume.findMany({
    where: { status: 'PUBLISHED', availability: { not: 'HIDDEN' }, ...(filters.length ? { OR: filters } : {}) },
    orderBy: [{ popularityScore: 'desc' }, { viewCount: 'desc' }],
    take,
    include: { brand: { select: { name: true, nameAr: true } }, mainImage: CARD_MAIN_MEDIA_SELECT, media: CARD_MEDIA_SELECT },
  });
}
