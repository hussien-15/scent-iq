import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin, enforceRateLimit, requestSecurityKey } from '@/lib/security';

export const runtime = 'nodejs';

const eventSchema = z.object({
  event: z.enum([
    'PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'REMOVE_FROM_CART',
    'CHECKOUT_STARTED', 'WISHLIST_ADDED', 'WISHLIST_REMOVED',
    'COLLECTION_VIEW', 'COLLECTION_PRODUCT_CLICK', 'COLLECTION_ADD_TO_CART',
    'RECOMMENDATION_IMPRESSION', 'RECOMMENDATION_CLICK',
  ]),
  sessionId: z.string().min(8).max(100).optional(),
  perfumeId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  pathname: z.string().max(500).optional(),
  referrer: z.string().url().max(1000).optional(),
  campaign: z.string().max(120).optional(),
  source: z.string().max(120).optional(),
  value: z.number().finite().min(0).max(1_000_000).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

function deviceFromUserAgent(userAgent: string | null) {
  const ua = (userAgent ?? '').toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(ua)) return 'TABLET' as const;
  if (/mobi|iphone|android/.test(ua)) return 'MOBILE' as const;
  if (ua) return 'DESKTOP' as const;
  return 'UNKNOWN' as const;
}

function sourceFromRequest(input: { source?: string; campaign?: string; referrer?: string }) {
  const raw = `${input.source ?? ''} ${input.referrer ?? ''}`.toLowerCase();
  if (input.campaign) return 'CAMPAIGN' as const;
  if (raw.includes('google.')) return 'GOOGLE' as const;
  if (raw.includes('instagram')) return 'INSTAGRAM' as const;
  if (raw.includes('tiktok')) return 'TIKTOK' as const;
  if (raw.includes('facebook') || raw.includes('fb.com')) return 'FACEBOOK' as const;
  if (raw.includes('whatsapp') || raw.includes('wa.me')) return 'WHATSAPP' as const;
  if (input.source && ['social', 'twitter', 'x'].includes(input.source.toLowerCase())) return 'SOCIAL' as const;
  if (input.referrer) return 'REFERRAL' as const;
  return 'DIRECT' as const;
}

function startOfIraqDay(date = new Date()) {
  const shifted = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 3 * 60 * 60 * 1000);
}

function recommendationBlockType(value: unknown) {
  const label = String(value ?? '').toLowerCase();
  if (label.includes('budget')) return 'BUDGET_ALTERNATIVES' as const;
  if (label.includes('luxury')) return 'LUXURY_ALTERNATIVES' as const;
  if (label.includes('same brand')) return 'SAME_BRAND' as const;
  if (label.includes('season')) return 'SEASONAL_PICKS' as const;
  if (label.includes('also viewed') || label.includes('trending')) return 'TRENDING' as const;
  if (label.includes('you may') || label.includes('similar')) return 'SIMILAR_FRAGRANCES' as const;
  return 'EDITOR_PICK' as const;
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit('analytics.event', requestSecurityKey(request.headers), 180, 60 * 1000);
    const input = eventSchema.parse(await request.json());
    const session = await auth();
    const device = deviceFromUserAgent(request.headers.get('user-agent'));
    const source = sourceFromRequest(input);
    const sourceDetail = input.campaign ?? input.source ?? (input.referrer ? new URL(input.referrer).hostname : undefined);
    const today = startOfIraqDay();

    const recentWindow = new Date(Date.now() - 30 * 60 * 1000);
    const shouldDedupe = ['PRODUCT_VIEW', 'CHECKOUT_STARTED', 'RECOMMENDATION_IMPRESSION'].includes(input.event);
    if (shouldDedupe && input.sessionId) {
      const duplicate = await prisma.analyticsEvent.findFirst({
        where: {
          eventType: input.event,
          sessionId: input.sessionId,
          perfumeId: input.perfumeId,
          createdAt: { gte: recentWindow },
        },
        select: { id: true },
      });
      if (duplicate) return apiSuccess({ accepted: true, deduplicated: true }, { status: 202 });
    }

    const firstVisitToday = input.event === 'PAGE_VIEW' && input.sessionId
      ? !(await prisma.analyticsEvent.findFirst({
          where: { eventType: 'PAGE_VIEW', sessionId: input.sessionId, createdAt: { gte: today } },
          select: { id: true },
        }))
      : false;

    const metadata = input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined;
    await prisma.$transaction(async (tx) => {
      await tx.analyticsEvent.create({
        data: {
          eventType: input.event,
          sessionId: input.sessionId,
          userId: session?.user?.id,
          perfumeId: input.perfumeId,
          brandId: input.brandId,
          collectionId: input.collectionId,
          pathname: input.pathname,
          source,
          sourceDetail,
          device,
          value: input.value,
          metadata,
        },
      });

      if (input.event === 'PRODUCT_VIEW' && input.perfumeId) {
        await tx.userInteraction.create({
          data: { perfumeId: input.perfumeId, userId: session?.user?.id, actionType: 'VIEW' },
        });
        await tx.perfume.update({ where: { id: input.perfumeId }, data: { viewCount: { increment: 1 } } });
      }
      if (input.event === 'WISHLIST_ADDED' && input.perfumeId) {
        await tx.perfume.update({ where: { id: input.perfumeId }, data: { wishlistCount: { increment: 1 } } });
      }
      if (input.event === 'WISHLIST_REMOVED' && input.perfumeId) {
        await tx.perfume.updateMany({ where: { id: input.perfumeId, wishlistCount: { gt: 0 } }, data: { wishlistCount: { decrement: 1 } } });
      }
      if (['RECOMMENDATION_IMPRESSION', 'RECOMMENDATION_CLICK'].includes(input.event) && input.perfumeId) {
        await tx.recommendationLog.create({
          data: {
            sessionId: input.sessionId,
            recommendedProductId: input.perfumeId,
            blockType: recommendationBlockType(input.metadata?.recommendationType),
            action: input.event === 'RECOMMENDATION_CLICK' ? 'CLICK' : 'IMPRESSION',
          },
        });
      }

      if (input.event === 'PAGE_VIEW' || input.event === 'PRODUCT_VIEW') {
        await tx.dailyAnalytics.upsert({
          where: { date: today },
          update: {
            ...(firstVisitToday ? { visitors: { increment: 1 } } : {}),
            ...(input.event === 'PRODUCT_VIEW' ? { productViews: { increment: 1 } } : {}),
          },
          create: {
            date: today,
            visitors: firstVisitToday ? 1 : 0,
            productViews: input.event === 'PRODUCT_VIEW' ? 1 : 0,
          },
        });
      }
    });

    return apiSuccess({ accepted: true, deduplicated: false }, { status: 202 });
  } catch (error) {
    // The browser treats analytics as best-effort; the API still reports a
    // truthful, standardized error for monitoring and debugging.
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
