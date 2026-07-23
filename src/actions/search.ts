'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { normalizeArabic } from '@/utils/arabic-normalize';
import { headers } from 'next/headers';
import { enforceRateLimit, requestSecurityKey } from '@/lib/security';

/**
 * Logs a submitted search — feeds the "trending searches" idea and, later,
 * per-user "recent searches". Fire-and-forget from the client (the search
 * itself shouldn't wait on this), and never throws — a logging failure
 * should never block someone from seeing their results.
 */
export async function logSearch(keyword: string, resultsCount: number) {
  const trimmed = keyword.trim().slice(0, 120);
  if (!trimmed) return;

  try {
    await enforceRateLimit('search.log', requestSecurityKey(headers()), 120, 60 * 60 * 1000);
    const session = await auth();
    await prisma.searchLog.create({
      data: {
        keyword: trimmed,
        normalizedKeyword: normalizeArabic(trimmed),
        resultsCount: Math.max(0, Math.min(10000, Math.floor(resultsCount))),
        userId: session?.user?.id,
      },
    });
  } catch {
    // Non-critical — searching should never fail because logging did.
  }
}

/**
 * Records which result a search led to — feeds "Most clicked search
 * results" in the admin insights page. Best-effort: updates the most
 * recent matching history row rather than requiring the client to carry a
 * search-history ID around.
 */
export async function logSearchClick(
  keyword: string,
  clicked: { perfumeId?: string; brandId?: string }
) {
  try {
    await enforceRateLimit('search.click', requestSecurityKey(headers()), 120, 60 * 60 * 1000);
    const recent = await prisma.searchLog.findFirst({
      where: { normalizedKeyword: normalizeArabic(keyword) },
      orderBy: { createdAt: 'desc' },
    });
    if (!recent) return;

    await prisma.searchLog.update({
      where: { id: recent.id },
      data: { clickedPerfumeId: clicked.perfumeId, clickedBrandId: clicked.brandId },
    });
  } catch {
    // Non-critical.
  }
}
