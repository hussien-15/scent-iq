'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { collectionSchema, type CollectionFormInput } from '@/lib/validations/collection';
import type { CollectionRules } from '@/services/collection.service';

export type CollectionActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const emptyState: CollectionActionState = {};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function optional(value: string) {
  return value || undefined;
}

function numberOrUndefined(value: string) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function selected(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function parseBase(formData: FormData) {
  return collectionSchema.safeParse({
    name: text(formData, 'name'),
    nameAr: text(formData, 'nameAr'),
    slug: text(formData, 'slug'),
    type: text(formData, 'type'),
    status: text(formData, 'status'),
    shortDescription: optional(text(formData, 'shortDescription')),
    shortDescriptionAr: optional(text(formData, 'shortDescriptionAr')),
    description: optional(text(formData, 'description')),
    descriptionAr: optional(text(formData, 'descriptionAr')),
    buyingGuide: optional(text(formData, 'buyingGuide')),
    buyingGuideAr: optional(text(formData, 'buyingGuideAr')),
    coverImage: text(formData, 'coverImage'),
    coverAlt: optional(text(formData, 'coverAlt')),
    coverAltAr: optional(text(formData, 'coverAltAr')),
    ogImage: text(formData, 'ogImage'),
    metaTitleEn: optional(text(formData, 'metaTitleEn')),
    metaTitleAr: optional(text(formData, 'metaTitleAr')),
    metaDescriptionEn: optional(text(formData, 'metaDescriptionEn')),
    metaDescriptionAr: optional(text(formData, 'metaDescriptionAr')),
    scheduledAt: optional(text(formData, 'scheduledAt')),
    homepageOrder: Number(text(formData, 'homepageOrder') || 0),
  });
}

function parseRules(formData: FormData): CollectionRules {
  return {
    brandIds: selected(formData, 'ruleBrandIds'),
    genders: selected(formData, 'ruleGenders') as CollectionRules['genders'],
    priceMin: numberOrUndefined(text(formData, 'rulePriceMin')),
    priceMax: numberOrUndefined(text(formData, 'rulePriceMax')),
    scentFamilies: selected(formData, 'ruleFamilies'),
    seasons: selected(formData, 'ruleSeasons'),
    occasions: selected(formData, 'ruleOccasions'),
    styles: selected(formData, 'ruleStyles'),
    noteIds: selected(formData, 'ruleNoteIds'),
    longevity: selected(formData, 'ruleLongevity') as CollectionRules['longevity'],
    projection: selected(formData, 'ruleProjection') as CollectionRules['projection'],
    sillage: selected(formData, 'ruleSillage') as CollectionRules['sillage'],
    availability: selected(formData, 'ruleAvailability') as CollectionRules['availability'],
    discounted: formData.get('ruleDiscounted') === 'on',
    newArrivals: formData.get('ruleNewArrivals') === 'on',
    bestSellers: formData.get('ruleBestSellers') === 'on',
    trending: formData.get('ruleTrending') === 'on',
    lowStock: formData.get('ruleLowStock') === 'on',
    mostViewed: formData.get('ruleMostViewed') === 'on',
    mostWishlisted: formData.get('ruleMostWishlisted') === 'on',
  };
}

function parseFaqs(formData: FormData) {
  return Array.from({ length: 6 }, (_, position) => ({
    questionEn: text(formData, `faqQuestionEn.${position}`),
    questionAr: optional(text(formData, `faqQuestionAr.${position}`)),
    answerEn: text(formData, `faqAnswerEn.${position}`),
    answerAr: optional(text(formData, `faqAnswerAr.${position}`)),
    position,
  })).filter((faq) => faq.questionEn && faq.answerEn);
}

function parseProductPlacements(formData: FormData) {
  const productIds = selected(formData, 'productIds');
  const pinnedIds = new Set(selected(formData, 'pinnedProductIds'));

  return productIds.map((perfumeId, index) => ({
    perfumeId,
    position: Math.max(0, Number(text(formData, `position.${perfumeId}`)) || index),
    pinned: pinnedIds.has(perfumeId),
    featuredLabelEn: optional(text(formData, `featuredLabelEn.${perfumeId}`)),
    featuredLabelAr: optional(text(formData, `featuredLabelAr.${perfumeId}`)),
    featuredReasonEn: optional(text(formData, `featuredReasonEn.${perfumeId}`)),
    featuredReasonAr: optional(text(formData, `featuredReasonAr.${perfumeId}`)),
  }));
}

function collectionData(input: CollectionFormInput, formData: FormData) {
  return {
    name: input.name,
    nameAr: input.nameAr,
    slug: input.slug,
    type: input.type,
    status: input.status,
    shortDescription: input.shortDescription || null,
    shortDescriptionAr: input.shortDescriptionAr || null,
    description: input.description || null,
    descriptionAr: input.descriptionAr || null,
    buyingGuide: input.buyingGuide || null,
    buyingGuideAr: input.buyingGuideAr || null,
    coverImage: input.coverImage || null,
    coverAlt: input.coverAlt || null,
    coverAltAr: input.coverAltAr || null,
    ogImage: input.ogImage || null,
    metaTitleEn: input.metaTitleEn || null,
    metaTitleAr: input.metaTitleAr || null,
    metaDescriptionEn: input.metaDescriptionEn || null,
    metaDescriptionAr: input.metaDescriptionAr || null,
    keywords: text(formData, 'keywords').split(',').map((item) => item.trim()).filter(Boolean),
    rules: parseRules(formData) as Prisma.InputJsonValue,
    manualOrdering: formData.get('manualOrdering') === 'on',
    featuredOnHomepage: formData.get('featuredOnHomepage') === 'on',
    homepageOrder: input.homepageOrder,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
  };
}

async function saveCollection(
  collectionId: string | null,
  _previousState: CollectionActionState,
  formData: FormData
): Promise<CollectionActionState> {
  const parsed = parseBase(formData);
  if (!parsed.success) {
    return { error: 'Review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const admin = await requirePermission(collectionId ? 'collections.edit' : 'collections.create');
    const adminId = admin.id;
    const faqs = parseFaqs(formData);
    const products = parseProductPlacements(formData);
    const relatedIds = selected(formData, 'relatedCollectionIds').filter((id) => id !== collectionId);

    const saved = await prisma.$transaction(async (tx) => {
      const collection = collectionId
        ? await tx.collection.update({
            where: { id: collectionId },
            data: collectionData(parsed.data, formData),
          })
        : await tx.collection.create({ data: collectionData(parsed.data, formData) });

      await Promise.all([
        tx.collectionProduct.deleteMany({ where: { collectionId: collection.id } }),
        tx.collectionFaq.deleteMany({ where: { collectionId: collection.id } }),
        tx.collectionRelation.deleteMany({ where: { collectionId: collection.id } }),
      ]);

      if (products.length) {
        await tx.collectionProduct.createMany({
          data: products.map((product) => ({ ...product, collectionId: collection.id })),
        });
      }
      if (faqs.length) {
        await tx.collectionFaq.createMany({
          data: faqs.map((faq) => ({ ...faq, collectionId: collection.id })),
        });
      }
      if (relatedIds.length) {
        await tx.collectionRelation.createMany({
          data: relatedIds.map((relatedCollectionId, position) => ({
            collectionId: collection.id,
            relatedCollectionId,
            position,
          })),
        });
      }

      await tx.activityLog.create({
        data: {
          adminId,
          actorName: admin.name ?? admin.email,
          action: collectionId ? 'collection.updated' : 'collection.created',
          affectedType: 'Collection',
          affectedId: collection.id,
          affectedName: collection.name,
        },
      });

      return collection;
    });

    revalidatePath('/studio/collections');
    revalidatePath('/sitemap.xml');
    revalidatePath('/ar/collections');
    revalidatePath('/en/collections');
    revalidatePath('/ar');
    revalidatePath('/en');
    revalidatePath(`/ar/collections/${saved.slug}`);
    revalidatePath(`/en/collections/${saved.slug}`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'The slug is already used by another collection.' };
    }
    return { error: 'The collection could not be saved. Check the database connection and try again.' };
  }

  redirect('/studio/collections?saved=1');
}

export async function createCollection(previousState = emptyState, formData: FormData) {
  return saveCollection(null, previousState, formData);
}

export async function updateCollection(
  collectionId: string,
  previousState: CollectionActionState,
  formData: FormData
) {
  return saveCollection(collectionId, previousState, formData);
}
