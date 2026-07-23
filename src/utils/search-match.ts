import { normalizeArabic } from './arabic-normalize';

export type SearchablePerfume = {
  nameEn: string;
  nameAr: string;
  slug?: string;
  searchAliases?: string[];
  keywords?: string[];
  scentFamilies?: string[];
  brand: { name: string; nameAr?: string | null; searchAliases?: string[] };
  notes?: { note: { nameEn: string; nameAr: string } }[];
};

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

function searchableValues(perfume: SearchablePerfume): string[] {
  return [
    perfume.nameEn,
    perfume.nameAr,
    perfume.slug?.replace(/-/g, ' ') ?? '',
    perfume.brand.name,
    perfume.brand.nameAr ?? '',
    ...(perfume.searchAliases ?? []),
    ...(perfume.brand.searchAliases ?? []),
    ...(perfume.keywords ?? []),
    ...(perfume.scentFamilies ?? []),
    ...(perfume.notes ?? []).flatMap(({ note }) => [note.nameEn, note.nameAr]),
  ].filter(Boolean);
}

/**
 * A deterministic, database-independent search rank for the first catalog
 * size. It handles Arabic letter variants/diacritics, aliases, notes, and a
 * one-character typo without requiring a paid search service.
 */
export function searchScore(perfume: SearchablePerfume, query: string): number {
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery) return 0;

  const values = searchableValues(perfume).map(normalizeArabic);
  const primaryNames = [normalizeArabic(perfume.nameEn), normalizeArabic(perfume.nameAr)];

  if (primaryNames.includes(normalizedQuery)) return 120;
  if (primaryNames.some((value) => value.startsWith(normalizedQuery))) return 100;
  if (values.some((value) => value === normalizedQuery)) return 90;
  if (values.some((value) => value.includes(normalizedQuery))) return 70;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const valueTokens = values.flatMap((value) => value.split(' ')).filter(Boolean);
  const allTokensMatch = queryTokens.every((queryToken) =>
    valueTokens.some((valueToken) => {
      if (valueToken.startsWith(queryToken) || queryToken.startsWith(valueToken)) return true;
      const typoAllowance = Math.max(queryToken.length, valueToken.length) >= 5 ? 1 : 0;
      return typoAllowance > 0 && editDistance(queryToken, valueToken) <= typoAllowance;
    })
  );

  return allTokensMatch ? 50 : 0;
}

export function matchesPerfumeSearch(perfume: SearchablePerfume, query: string): boolean {
  return searchScore(perfume, query) > 0;
}
