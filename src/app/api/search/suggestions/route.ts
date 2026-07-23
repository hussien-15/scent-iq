import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { enforceRateLimit, requestSecurityKey } from '@/lib/security';
import { getSearchSuggestions } from '@/services/search.service';
import { searchSuggestionSchema } from '@/validators/common';

export async function GET(request: NextRequest) {
  const started = performance.now();
  try {
    await enforceRateLimit('search.suggestions', requestSecurityKey(request.headers), 60, 60 * 1000);
    const input = searchSuggestionSchema.parse({
      q: request.nextUrl.searchParams.get('q') ?? '',
      limit: request.nextUrl.searchParams.get('limit') ?? undefined,
    });
    const results = await getSearchSuggestions(input.q, input.limit);
    return apiSuccess({ results }, { headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Server-Timing': `search;dur=${(performance.now() - started).toFixed(1)}`,
    } });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
