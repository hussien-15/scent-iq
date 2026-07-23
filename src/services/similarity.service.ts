import { prisma } from '@/lib/prisma';

/**
 * Similarity Scoring Engine — Phase 3.
 *
 * Every recommendation block on the site (You May Also Like, Customers
 * Also Viewed, Seasonal Picks, ...) is a different *candidate pool* fed
 * through this same scorer, rather than a one-off query with its own
 * hand-rolled ranking. That's the point of centralizing it: one explainable,
 * testable function instead of a dozen slightly-different "similar
 * products" queries scattered across pages.
 *
 * Deliberately rule-based, no paid AI APIs — matches the spec. The scoring
 * surface (features in, weighted sum out) is exactly the shape an
 * embedding-based scorer would have too, so swapping in vector similarity
 * later (per "Future Compatibility" in the spec) means changing what feeds
 * this function, not redesigning it.
 */

export type SimilarityWeights = {
  notes: number;
  family: number;
  gender: number;
  occasion: number;
  season: number;
  style: number;
  mood: number;
  brand: number;
  price: number;
  performance: number;
};

export const DEFAULT_WEIGHTS: SimilarityWeights = {
  notes: 0.25,
  family: 0.2,
  brand: 0.15,
  occasion: 0.12,
  season: 0.1,
  style: 0.1,
  mood: 0.05,
  gender: 0.02,
  price: 0.008,
  performance: 0.002,
};

/**
 * Weights live in Settings (the key/value store from Step 5) rather than
 * as a hardcoded constant, so "adjust recommendation weights" from the
 * spec's Admin Control section is a data change, not a code change — even
 * before Perfume Studio has a screen for it. Falls back to
 * DEFAULT_WEIGHTS if nothing's configured yet.
 */
export async function getSimilarityWeights(): Promise<SimilarityWeights> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'recommendation.weights' } });
    if (!row) return DEFAULT_WEIGHTS;
    const configured = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    return configured && typeof configured === 'object' && !Array.isArray(configured)
      ? { ...DEFAULT_WEIGHTS, ...configured }
      : DEFAULT_WEIGHTS;
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

const PERFORMANCE_ORDER = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];

type Features = {
  id: string;
  brandId: string;
  gender: string;
  scentFamilies: string[];
  season: string[];
  occasion: string[];
  style: string[];
  mood: string[];
  price: number;
  longevity: string | null;
  projection: string | null;
  sillage: string | null;
  noteIds: string[];
};

/** Jaccard overlap: shared / union. 1 when identical, 0 when disjoint. */
function overlap(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const shared = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : shared / union;
}

function genderScore(a: string, b: string): number {
  if (a === b) return 1;
  if (a === 'UNISEX' || b === 'UNISEX') return 0.5;
  return 0;
}

function priceScore(a: number, b: number): number {
  const diff = Math.abs(a - b);
  const base = Math.max(a, b, 1);
  return Math.max(0, 1 - diff / base);
}

function performanceScore(a: Features, b: Features): number {
  const pairs: [string | null, string | null][] = [
    [a.longevity, b.longevity],
    [a.projection, b.projection],
    [a.sillage, b.sillage],
  ];
  const scored = pairs.filter(([x, y]) => x && y);
  if (scored.length === 0) return 0;
  const diffs = scored.map(
    ([x, y]) => Math.abs(PERFORMANCE_ORDER.indexOf(x!) - PERFORMANCE_ORDER.indexOf(y!)) / 3
  );
  return 1 - diffs.reduce((s, d) => s + d, 0) / diffs.length;
}

export type ScoredMatch<T> = {
  item: T;
  score: number;
  breakdown: Record<keyof SimilarityWeights, number>;
  topFactor: keyof SimilarityWeights;
};

/**
 * Scores every candidate against a reference perfume. `brandSimilarity` is
 * a lookup of brandId -> weight for the reference perfume's brand (query
 * BrandSimilarity once per call site, not once per candidate).
 */
export function scoreCandidates<T extends Features>(
  reference: Features,
  candidates: T[],
  weights: SimilarityWeights,
  brandSimilarity: Map<string, number>
): ScoredMatch<T>[] {
  return candidates
    .map((candidate) => {
      const brandScore =
        candidate.brandId === reference.brandId ? 1 : brandSimilarity.get(candidate.brandId) ?? 0;

      const breakdown: Record<keyof SimilarityWeights, number> = {
        notes: overlap(reference.noteIds, candidate.noteIds),
        family: overlap(reference.scentFamilies, candidate.scentFamilies),
        gender: genderScore(reference.gender, candidate.gender),
        occasion: overlap(reference.occasion, candidate.occasion),
        season: overlap(reference.season, candidate.season),
        style: overlap(reference.style, candidate.style),
        mood: overlap(reference.mood, candidate.mood),
        brand: brandScore,
        price: priceScore(reference.price, candidate.price),
        performance: performanceScore(reference, candidate),
      };

      const score = (Object.keys(breakdown) as (keyof SimilarityWeights)[]).reduce(
        (sum, key) => sum + breakdown[key] * weights[key],
        0
      );

      const topFactor = (Object.keys(breakdown) as (keyof SimilarityWeights)[]).reduce((best, key) =>
        breakdown[key] * weights[key] > breakdown[best] * weights[best] ? key : best
      );

      return { item: candidate, score, breakdown, topFactor };
    })
    .sort((a, b) => b.score - a.score);
}

/** Loads a perfume's scoring features in the shape scoreCandidates expects. */
export async function loadFeatures(perfumeId: string): Promise<Features | null> {
  const p = await prisma.perfume.findUnique({
    where: { id: perfumeId },
    include: { notes: { select: { noteId: true } } },
  });
  if (!p) return null;

  return {
    id: p.id,
    brandId: p.brandId,
    gender: p.gender,
    scentFamilies: p.scentFamilies,
    season: p.season,
    occasion: p.occasion,
    style: p.style,
    mood: p.mood,
    price: typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price),
    longevity: p.longevity,
    projection: p.projection,
    sillage: p.sillage,
    noteIds: p.notes.map((n: { noteId: string }) => n.noteId),
  };
}

/** brandId -> similarity weight, for every brand related to `brandId`. */
export async function loadBrandSimilarity(brandId: string): Promise<Map<string, number>> {
  const rows = await prisma.brandSimilarity.findMany({ where: { brandId } });
  return new Map(
    rows.map((r: { similarBrandId: string; weight: number }) => [r.similarBrandId, r.weight])
  );
}
