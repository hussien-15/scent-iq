'use server';

import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { reviewSubmissionSchema } from '@/lib/validations/review';
import { requirePermission } from '@/lib/authorization';
import type { AdminPermission } from '@/lib/permissions';
import { enforceRateLimit, hasValidImageSignature, isAllowedImage, requestSecurityKey } from '@/lib/security';

export type SubmitReviewState = {
  success?: boolean;
  error?: 'validation' | 'duplicate' | 'spam' | 'photo' | 'server';
};

const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'REPORTED'] as const;

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function optionalString(formData: FormData, key: string) {
  return stringValue(formData, key) || undefined;
}

function ratingValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value ? Number(value) : undefined;
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('964') ? digits.slice(3) : digits.replace(/^0/, '');
}

function fingerprint(value: string) {
  return createHash('sha256')
    .update(`${process.env.AUTH_SECRET ?? 'scentiq-local'}:${value}`)
    .digest('hex');
}

function looksLikeSpam(comment: string) {
  const urls = comment.match(/https?:\/\/|www\./gi)?.length ?? 0;
  const repeated = /(.)\1{8,}/i.test(comment);
  const lowVariety = new Set(comment.toLowerCase().replace(/\s/g, '')).size < 5;
  return urls > 1 || repeated || lowVariety;
}

async function requireAdmin(permission: AdminPermission = 'reviews.manage') {
  return (await requirePermission(permission)).id;
}

async function findVerifiedPurchase(perfumeId: string, userId?: string, phone?: string) {
  if (userId) {
    const accountOrder = await prisma.order.findFirst({
      where: { userId, status: 'DELIVERED', items: { some: { perfumeId } } },
      select: { id: true, customerId: true },
      orderBy: { createdAt: 'desc' },
    });
    if (accountOrder) return accountOrder;
  }
  if (!phone) return null;

  const delivered = await prisma.order.findMany({
    where: { status: 'DELIVERED', items: { some: { perfumeId } } },
    select: { id: true, customerId: true, phone: true, alternativePhone: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const normalized = normalizePhone(phone);
  return delivered.find(
    (order) =>
      normalizePhone(order.phone) === normalized ||
      (order.alternativePhone && normalizePhone(order.alternativePhone) === normalized)
  );
}

async function refreshProductReviewAggregate(perfumeId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { perfumeId, approvalStatus: 'APPROVED' },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.perfume.update({
    where: { id: perfumeId },
    data: { averageRating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count.rating },
  });
}

export async function submitReview(
  _previousState: SubmitReviewState,
  formData: FormData
): Promise<SubmitReviewState> {
  try { await enforceRateLimit('review.submit', requestSecurityKey(await headers()), 5, 60 * 60 * 1000); } catch { return { error: 'server' }; }
  const session = await auth();
  const parsed = reviewSubmissionSchema.safeParse({
    perfumeId: stringValue(formData, 'perfumeId'),
    reviewerName: stringValue(formData, 'reviewerName') || session?.user?.name || '',
    phone: optionalString(formData, 'phone'),
    rating: ratingValue(formData, 'rating'),
    longevityRating: ratingValue(formData, 'longevityRating'),
    projectionRating: ratingValue(formData, 'projectionRating'),
    sillageRating: ratingValue(formData, 'sillageRating'),
    valueRating: ratingValue(formData, 'valueRating'),
    smellQualityRating: ratingValue(formData, 'smellQualityRating'),
    packagingQualityRating: ratingValue(formData, 'packagingQualityRating'),
    deliveryRating: ratingValue(formData, 'deliveryRating'),
    comment: stringValue(formData, 'comment'),
    wouldRecommend: stringValue(formData, 'wouldRecommend') === 'yes',
    wouldBuyAgain: stringValue(formData, 'wouldBuyAgain')
      ? stringValue(formData, 'wouldBuyAgain') === 'yes'
      : undefined,
    ageRange: optionalString(formData, 'ageRange'),
    reviewerGender: optionalString(formData, 'reviewerGender'),
    usageOccasion: optionalString(formData, 'usageOccasion'),
    seasonUsed: optionalString(formData, 'seasonUsed'),
  });
  if (!parsed.success || (!session?.user?.id && !parsed.data.phone)) return { error: 'validation' };
  if (looksLikeSpam(parsed.data.comment)) return { error: 'spam' };

  const reviewerFingerprint = session?.user?.id
    ? fingerprint(`user:${session.user.id}`)
    : fingerprint(`phone:${normalizePhone(parsed.data.phone!)}`);
  const duplicateFingerprints = [
    reviewerFingerprint,
    ...(parsed.data.phone ? [fingerprint(`phone:${normalizePhone(parsed.data.phone)}`)] : []),
  ];
  const photo = formData.get('photo');
  if (photo instanceof File && photo.size > 0) {
    if (!isAllowedImage(photo) || photo.size > 5 * 1024 * 1024 || !(await hasValidImageSignature(photo))) return { error: 'photo' };
  }

  try {
    const [perfume, existing] = await Promise.all([
      prisma.perfume.findFirst({
        where: { id: parsed.data.perfumeId, status: 'PUBLISHED' },
        select: { id: true, slug: true, nameEn: true },
      }),
      prisma.review.findFirst({
        where: {
          perfumeId: parsed.data.perfumeId,
          OR: [
            { reviewerFingerprint: { in: duplicateFingerprints } },
            ...(session?.user?.id ? [{ userId: session.user.id }] : []),
          ],
        },
        select: { id: true },
      }),
    ]);
    if (!perfume) return { error: 'validation' };
    if (existing) return { error: 'duplicate' };

    const verifiedOrder = await findVerifiedPurchase(
      perfume.id,
      session?.user?.id,
      parsed.data.phone
    );
    let imageUrl: string | undefined;
    if (photo instanceof File && photo.size > 0) {
      try {
        imageUrl = await uploadImageToCloudinary(photo, 'scentiq/reviews');
      } catch {
        return { error: 'photo' };
      }
    }

    await prisma.review.create({
      data: {
        userId: session?.user?.id,
        customerId: verifiedOrder?.customerId,
        orderId: verifiedOrder?.id,
        reviewerName: parsed.data.reviewerName,
        reviewerFingerprint,
        perfumeId: perfume.id,
        rating: parsed.data.rating,
        longevityRating: parsed.data.longevityRating,
        projectionRating: parsed.data.projectionRating,
        sillageRating: parsed.data.sillageRating,
        valueRating: parsed.data.valueRating,
        smellQualityRating: parsed.data.smellQualityRating,
        packagingQualityRating: parsed.data.packagingQualityRating,
        deliveryRating: parsed.data.deliveryRating,
        comment: parsed.data.comment,
        wouldRecommend: parsed.data.wouldRecommend,
        wouldBuyAgain: parsed.data.wouldBuyAgain,
        ageRange: parsed.data.ageRange,
        reviewerGender: parsed.data.reviewerGender,
        usageOccasion: parsed.data.usageOccasion,
        seasonUsed: parsed.data.seasonUsed,
        verifiedPurchase: Boolean(verifiedOrder),
        approvalStatus: 'PENDING',
        images: imageUrl
          ? { create: { url: imageUrl, altText: `Customer review photo for ${perfume.nameEn}` } }
          : undefined,
      },
    });

    revalidatePath(`/ar/product/${perfume.slug}`);
    revalidatePath(`/en/product/${perfume.slug}`);
    revalidatePath('/studio/reviews');
    revalidatePath('/ar');
    revalidatePath('/en');
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'duplicate' };
    }
    return { error: 'server' };
  }
}

export async function setReviewStatus(
  reviewId: string,
  approvalStatus: (typeof REVIEW_STATUSES)[number]
) {
  if (!REVIEW_STATUSES.includes(approvalStatus)) throw new Error('Invalid status');
  const adminId = await requireAdmin('reviews.approve');
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { approvalStatus },
    include: { perfume: { select: { nameEn: true, slug: true } } },
  });
  await refreshProductReviewAggregate(review.perfumeId);
  await prisma.activityLog.create({
    data: {
      adminId,
      action: `review.${approvalStatus.toLowerCase()}`,
      affectedType: 'Review',
      affectedId: review.id,
      affectedName: review.perfume.nameEn,
    },
  });
  revalidatePath('/studio/reviews');
  revalidatePath('/ar');
  revalidatePath('/en');
  revalidatePath(`/ar/product/${review.perfume.slug}`);
  revalidatePath(`/en/product/${review.perfume.slug}`);
}

export async function toggleReviewFeatured(reviewId: string) {
  const adminId = await requireAdmin();
  const review = await prisma.review.findUniqueOrThrow({
    where: { id: reviewId },
    select: { isFeatured: true, perfume: { select: { nameEn: true } } },
  });
  await prisma.$transaction([
    prisma.review.update({ where: { id: reviewId }, data: { isFeatured: !review.isFeatured } }),
    prisma.activityLog.create({
      data: {
        adminId,
        action: review.isFeatured ? 'review.unfeatured' : 'review.featured',
        affectedType: 'Review',
        affectedId: reviewId,
        affectedName: review.perfume.nameEn,
      },
    }),
  ]);
  revalidatePath('/studio/reviews');
}

export async function saveAdminReply(reviewId: string, reply: string) {
  const adminId = await requireAdmin();
  const clean = reply.trim().slice(0, 500);
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      adminReply: clean || null,
      adminReplyById: clean ? adminId : null,
      adminRepliedAt: clean ? new Date() : null,
    },
    select: { perfume: { select: { slug: true, nameEn: true } } },
  });
  await prisma.activityLog.create({ data: { adminId, action: clean ? 'review.reply.saved' : 'review.reply.removed', affectedType: 'Review', affectedId: reviewId, affectedName: review.perfume.nameEn } });
  revalidatePath('/studio/reviews');
  revalidatePath(`/ar/product/${review.perfume.slug}`);
  revalidatePath(`/en/product/${review.perfume.slug}`);
}

export async function setReviewImageStatus(
  imageId: string,
  approvalStatus: 'APPROVED' | 'REJECTED'
) {
  const adminId = await requireAdmin('reviews.approve');
  const image = await prisma.reviewImage.update({
    where: { id: imageId },
    data: { approvalStatus },
    select: { review: { select: { perfume: { select: { slug: true, nameEn: true } } } } },
  });
  await prisma.activityLog.create({ data: { adminId, action: `review.image.${approvalStatus.toLowerCase()}`, affectedType: 'ReviewImage', affectedId: imageId, affectedName: image.review.perfume.nameEn } });
  revalidatePath('/studio/reviews');
  revalidatePath(`/ar/product/${image.review.perfume.slug}`);
  revalidatePath(`/en/product/${image.review.perfume.slug}`);
}

export async function deleteSpamReview(reviewId: string) {
  const adminId = await requireAdmin();
  const review = await prisma.review.findUniqueOrThrow({
    where: { id: reviewId },
    select: { perfumeId: true, perfume: { select: { nameEn: true } } },
  });
  await prisma.$transaction([
    prisma.review.delete({ where: { id: reviewId } }),
    prisma.activityLog.create({
      data: {
        adminId,
        action: 'review.spam_deleted',
        affectedType: 'Review',
        affectedId: reviewId,
        affectedName: review.perfume.nameEn,
      },
    }),
  ]);
  await refreshProductReviewAggregate(review.perfumeId);
  revalidatePath('/studio/reviews');
}

export async function voteReview(
  reviewId: string,
  value: 'HELPFUL' | 'NOT_HELPFUL',
  anonymousToken: string
) {
  await enforceRateLimit('review.vote', requestSecurityKey(await headers(), anonymousToken.slice(0, 40)), 40, 60 * 60 * 1000);
  const session = await auth();
  const voterFingerprint = session?.user?.id
    ? fingerprint(`user:${session.user.id}`)
    : fingerprint(`anonymous:${anonymousToken.slice(0, 100)}`);

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findFirst({
      where: { id: reviewId, approvalStatus: 'APPROVED' },
      select: { helpfulYes: true, helpfulNo: true },
    });
    if (!review) return null;
    const existing = await tx.reviewVote.findUnique({
      where: { reviewId_voterFingerprint: { reviewId, voterFingerprint } },
    });
    if (!existing) {
      await tx.reviewVote.create({
        data: { reviewId, userId: session?.user?.id, voterFingerprint, value },
      });
      await tx.review.update({
        where: { id: reviewId },
        data: value === 'HELPFUL' ? { helpfulYes: { increment: 1 } } : { helpfulNo: { increment: 1 } },
      });
    } else if (existing.value !== value) {
      await tx.reviewVote.update({ where: { id: existing.id }, data: { value } });
      await tx.review.update({
        where: { id: reviewId },
        data:
          value === 'HELPFUL'
            ? { helpfulYes: { increment: 1 }, helpfulNo: { decrement: 1 } }
            : { helpfulNo: { increment: 1 }, helpfulYes: { decrement: 1 } },
      });
    }
    return tx.review.findUnique({
      where: { id: reviewId },
      select: { helpfulYes: true, helpfulNo: true },
    });
  });
}

export async function reportReview(reviewId: string, anonymousToken: string, reason?: string) {
  await enforceRateLimit('review.report', requestSecurityKey(await headers(), anonymousToken.slice(0, 40)), 10, 60 * 60 * 1000);
  const session = await auth();
  const reporterFingerprint = session?.user?.id
    ? fingerprint(`user:${session.user.id}`)
    : fingerprint(`anonymous:${anonymousToken.slice(0, 100)}`);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.reviewReport.create({
        data: {
          reviewId,
          userId: session?.user?.id,
          reporterFingerprint,
          reason: reason?.trim().slice(0, 300),
        },
      });
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: { reportCount: { increment: 1 } },
        select: { reportCount: true },
      });
      if (updated.reportCount >= 3) {
        await tx.review.update({ where: { id: reviewId }, data: { approvalStatus: 'REPORTED' } });
      }
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
  }
}

export async function markOrderReviewRequest(orderId: string) {
  const adminId = await requireAdmin('orders.update_status');
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: 'DELIVERED' },
    select: { id: true },
  });
  if (!order) throw new Error('Only delivered orders can be marked for review');
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { reviewRequestMarkedAt: new Date() } }),
    prisma.activityLog.create({
      data: {
        adminId,
        action: 'order.review_request_ready',
        affectedType: 'Order',
        affectedId: orderId,
        affectedName: `#${orderId.slice(0, 8).toUpperCase()}`,
      },
    }),
  ]);
  revalidatePath(`/studio/orders/${orderId}`);
}

/** Backward-compatible alias for the old moderation component. */
export async function setReviewApproval(reviewId: string, approvalStatus: 'APPROVED' | 'REJECTED') {
  return setReviewStatus(reviewId, approvalStatus);
}
