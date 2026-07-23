import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-response';
import { requirePermission } from '@/lib/authorization';
import { assertSameOrigin, enforceRateLimit, requestSecurityKey } from '@/lib/security';
import { revalidateTarget } from '@/services/revalidation.service';

export const runtime = 'nodejs';

const targetSchema = z.discriminatedUnion('entity', [
  z.object({ entity: z.literal('home') }),
  z.object({ entity: z.literal('shop') }),
  z.object({ entity: z.literal('product'), slug: z.string().min(1).max(180) }),
  z.object({ entity: z.literal('brand'), slug: z.string().min(1).max(180) }),
  z.object({ entity: z.literal('collection'), slug: z.string().min(1).max(180) }),
  z.object({ entity: z.literal('order'), id: z.string().uuid() }),
]);

function safeSecretEqual(received: string, expected: string) {
  const left = createHash('sha256').update(received).digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    const configuredSecret = process.env.REVALIDATION_SECRET ?? '';
    const secretAuthorized = Boolean(configuredSecret && bearer && safeSecretEqual(bearer, configuredSecret));
    let actorKey = 'automation';
    if (!secretAuthorized) {
      assertSameOrigin(request);
      const admin = await requirePermission('settings.edit');
      actorKey = admin.id;
    }
    await enforceRateLimit('cache.revalidate', requestSecurityKey(request.headers, actorKey), 30, 60 * 1000);
    const target = targetSchema.parse(await request.json());
    const paths = revalidateTarget(target);
    return apiSuccess({ revalidated: true, paths }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
