import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin, enforceRateLimit, requestSecurityKey } from '@/lib/security';

export const runtime = 'nodejs';

const payloadSchema = z.object({
  id: z.string().min(3).max(160),
  name: z.enum(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']),
  value: z.number().finite().min(0).max(300_000),
  delta: z.number().finite().min(0).max(300_000),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  pathname: z.string().startsWith('/').max(300),
  locale: z.enum(['ar', 'en']),
  navigationType: z.string().max(60).optional(),
});

function deviceFromRequest(request: NextRequest) {
  const ua = (request.headers.get('user-agent') ?? '').toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(ua)) return 'TABLET' as const;
  if (/mobi|iphone|android/.test(ua)) return 'MOBILE' as const;
  return ua ? 'DESKTOP' as const : 'UNKNOWN' as const;
}

export async function POST(request: NextRequest) {
  const started = performance.now();
  try {
    assertSameOrigin(request);
    await enforceRateLimit('analytics.vitals', requestSecurityKey(request.headers), 30, 60 * 1000);
    const input = payloadSchema.parse(await request.json());
    await prisma.coreWebVital.upsert({
      where: { metricId_name: { metricId: input.id, name: input.name } },
      update: {
        value: input.value, delta: input.delta, rating: input.rating,
        pathname: input.pathname, locale: input.locale, device: deviceFromRequest(request),
        navigationType: input.navigationType,
      },
      create: {
        metricId: input.id, name: input.name, value: input.value, delta: input.delta,
        rating: input.rating, pathname: input.pathname, locale: input.locale,
        device: deviceFromRequest(request), navigationType: input.navigationType,
      },
    });
    return apiSuccess({ accepted: true }, {
      status: 202,
      headers: {
        'Cache-Control': 'private, no-store',
        'Server-Timing': `app;dur=${(performance.now() - started).toFixed(1)}`,
      },
    });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
