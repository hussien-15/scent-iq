import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { publicCollectionWhere } from '@/services/collection.service';
import { assertSameOrigin, enforceRateLimit, requestSecurityKey } from '@/lib/security';

const EVENTS = ['VIEW', 'PRODUCT_CLICK', 'ADD_TO_CART'] as const;
const trackingSchema = z.object({
  collectionId: z.string().uuid(),
  event: z.enum(EVENTS),
  perfumeId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit('collections.track', requestSecurityKey(request.headers), 120, 60 * 1000);
    const body = trackingSchema.parse(await request.json());

    const collection = await prisma.collection.findFirst({
      where: { id: body.collectionId, ...publicCollectionWhere() },
      select: { id: true },
    });
    if (!collection) throw new NotFoundError('Collection');

    const session = await auth();
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    const createCounts = body.event === 'VIEW'
      ? { views: 1 }
      : body.event === 'PRODUCT_CLICK'
        ? { productClicks: 1 }
        : { addToCarts: 1 };
    const updateCounts = body.event === 'VIEW'
      ? { views: { increment: 1 } }
      : body.event === 'PRODUCT_CLICK'
        ? { productClicks: { increment: 1 } }
        : { addToCarts: { increment: 1 } };

    await prisma.$transaction([
      prisma.collectionInteraction.create({
        data: {
          collectionId: collection.id,
          userId: session?.user?.id,
          perfumeId: body.perfumeId,
          actionType: body.event,
        },
      }),
      prisma.collectionDailyAnalytics.upsert({
        where: { collectionId_date: { collectionId: collection.id, date } },
        update: updateCounts,
        create: { collectionId: collection.id, date, ...createCounts },
      }),
    ]);

    return apiSuccess({ accepted: true }, { status: 202 });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
