import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getAvailableDeliveryOptions } from '@/services/delivery.service';
import { enforceRateLimit, requestSecurityKey } from '@/lib/security';

export async function GET(request: NextRequest) {
  const started = performance.now();
  try {
    await enforceRateLimit('delivery.options', requestSecurityKey(request.headers), 60, 60 * 1000);
    const city = z.string().trim().max(80).parse(request.nextUrl.searchParams.get('city') ?? '');
    const options = city ? await getAvailableDeliveryOptions(city) : [];
    return apiSuccess({ options }, { headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Server-Timing': `delivery;dur=${(performance.now() - started).toFixed(1)}`,
    } });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
