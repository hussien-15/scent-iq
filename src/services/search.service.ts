import { findSearchCandidates } from '@/repositories/product.repository';
import { searchScore } from '@/utils/search-match';

export async function getSearchSuggestions(query: string, limit = 6) {
  if (query.trim().length < 2) return [];
  const candidates = await findSearchCandidates();
  return candidates
    .map((perfume) => ({ perfume, score: searchScore(perfume, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Math.max(limit, 1), 10))
    .map(({ perfume }) => perfume);
}
