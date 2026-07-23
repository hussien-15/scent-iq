import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { enforceRateLimit, requestSecurityKey } from '@/lib/security';
import { getProductAvailability } from '@/services/availability.service';
import { idListSchema } from '@/validators/common';

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit('inventory.availability', requestSecurityKey(request.headers), 120, 60 * 1000);
    const ids = idListSchema.parse([...new Set((request.nextUrl.searchParams.get('ids') ?? '').split(',').filter(Boolean))]);
    return apiSuccess({ products: await getProductAvailability(ids) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
