'use server';

import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { revalidateTarget } from '@/services/revalidation.service';
import { applyInventoryMovement } from '@/services/inventory.service';
import { slugCandidate } from '@/utils/slug';

const STATUSES = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'DISCONTINUED'] as const;
const GENDERS = ['MEN', 'WOMEN', 'MASCULINE', 'FEMININE', 'UNISEX'] as const;
const PERFORMANCE = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'] as const;
type Status = (typeof STATUSES)[number];

const productSchema = z.object({
  nameEn: z.string().min(2).max(140),
  nameAr: z.string().min(2).max(140),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  sku: z.string().min(2).max(80),
  brandId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(STATUSES),
  price: z.number().nonnegative().max(1_000_000_000),
  oldPrice: z.number().nonnegative().max(1_000_000_000).optional(),
  costPrice: z.number().nonnegative().max(1_000_000_000).optional(),
  initialStock: z.number().int().nonnegative().max(1_000_000),
  lowStockThreshold: z.number().int().nonnegative().max(100_000),
  gender: z.enum(GENDERS),
  descriptionEn: z.string().min(10).max(20_000),
  descriptionAr: z.string().min(10).max(20_000),
  longevity: z.enum(PERFORMANCE).optional(),
  projection: z.enum(PERFORMANCE).optional(),
  sillage: z.enum(PERFORMANCE).optional(),
});

export type ProductActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const emptyState: ProductActionState = {};
const text = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();
const optional = (value: string) => value || undefined;
const list = (formData: FormData, key: string) => formData.getAll(key).map(String).map((value) => value.trim()).filter(Boolean);
const csv = (formData: FormData, key: string) => text(formData, key).split(',').map((value) => value.trim()).filter(Boolean);
const optionalNumber = (value: string) => (value === '' ? undefined : Number(value));

function parsedProduct(formData: FormData) {
  return productSchema.safeParse({
    nameEn: text(formData, 'nameEn'),
    nameAr: text(formData, 'nameAr'),
    slug: text(formData, 'slug'),
    sku: text(formData, 'sku').toUpperCase(),
    brandId: text(formData, 'brandId'),
    categoryId: optional(text(formData, 'categoryId')),
    status: text(formData, 'status'),
    price: Number(text(formData, 'price')),
    oldPrice: optionalNumber(text(formData, 'oldPrice')),
    costPrice: optionalNumber(text(formData, 'costPrice')),
    initialStock: Number(text(formData, 'initialStock') || 0),
    lowStockThreshold: Number(text(formData, 'lowStockThreshold') || 5),
    gender: text(formData, 'gender'),
    descriptionEn: text(formData, 'descriptionEn'),
    descriptionAr: text(formData, 'descriptionAr'),
    longevity: optional(text(formData, 'longevity')),
    projection: optional(text(formData, 'projection')),
    sillage: optional(text(formData, 'sillage')),
  });
}

function scalarData(input: z.infer<typeof productSchema>, formData: FormData, isNew: boolean) {
  const discountPercent = input.oldPrice && input.oldPrice > input.price
    ? Math.round(((input.oldPrice - input.price) / input.oldPrice) * 100)
    : null;
  return {
    nameEn: input.nameEn,
    nameAr: input.nameAr,
    slug: input.slug,
    sku: input.sku,
    barcode: optional(text(formData, 'barcode')) ?? null,
    brandId: input.brandId,
    categoryId: input.categoryId ?? null,
    status: input.status,
    publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
    archivedAt: input.status === 'ARCHIVED' ? new Date() : null,
    price: input.price,
    oldPrice: input.oldPrice ?? null,
    costPrice: input.costPrice ?? null,
    discountPercent,
    currency: text(formData, 'currency') === 'USD' ? 'USD' : 'IQD',
    lowStockThreshold: input.lowStockThreshold,
    warehouseLocation: optional(text(formData, 'warehouseLocation')) ?? null,
    shortDescriptionEn: optional(text(formData, 'shortDescriptionEn')) ?? null,
    shortDescriptionAr: optional(text(formData, 'shortDescriptionAr')) ?? null,
    descriptionEn: input.descriptionEn,
    descriptionAr: input.descriptionAr,
    storyEn: optional(text(formData, 'storyEn')) ?? null,
    storyAr: optional(text(formData, 'storyAr')) ?? null,
    concentration: optional(text(formData, 'concentration')) ?? null,
    gender: input.gender,
    bottleSize: optional(text(formData, 'bottleSize')) ?? null,
    releaseYear: optionalNumber(text(formData, 'releaseYear')) ?? null,
    countryOfOrigin: optional(text(formData, 'countryOfOrigin')) ?? null,
    scentFamilies: csv(formData, 'scentFamilies'),
    longevity: input.longevity ?? null,
    projection: input.projection ?? null,
    sillage: input.sillage ?? null,
    season: list(formData, 'season'),
    occasion: list(formData, 'occasion'),
    style: list(formData, 'style'),
    mood: list(formData, 'mood'),
    metaTitleEn: optional(text(formData, 'metaTitleEn')) ?? null,
    metaTitleAr: optional(text(formData, 'metaTitleAr')) ?? null,
    metaDescriptionEn: optional(text(formData, 'metaDescriptionEn')) ?? null,
    metaDescriptionAr: optional(text(formData, 'metaDescriptionAr')) ?? null,
    keywords: csv(formData, 'keywords'),
    searchAliases: csv(formData, 'searchAliases'),
    ogImage: optional(text(formData, 'ogImage')) ?? null,
    canonicalUrl: optional(text(formData, 'canonicalUrl')) ?? null,
    mainImageId: optional(text(formData, 'mainImageId')) ?? null,
    videoId: optional(text(formData, 'videoId')) ?? null,
    ...(isNew ? { availability: 'OUT_OF_STOCK' as const, inventoryStatus: 'OUT_OF_STOCK' as const } : {}),
  };
}

async function saveProduct(
  productId: string | null,
  _previousState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsed = parsedProduct(formData);
  if (!parsed.success) {
    return { error: 'Review the required product fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const admin = await requirePermission(productId ? 'products.edit' : 'products.create');
    if (parsed.data.status === 'PUBLISHED') await requirePermission('products.publish');

    const noteRows = (['TOP', 'HEART', 'BASE'] as const).flatMap((tier) =>
      list(formData, `${tier.toLowerCase()}NoteIds`).map((noteId, sortOrder) => ({ noteId, tier, sortOrder }))
    );
    const tagIds = list(formData, 'tagIds');
    const galleryMediaIds = [...new Set(list(formData, 'galleryMediaIds'))];
    const mainImageId = optional(text(formData, 'mainImageId'));
    if (mainImageId && !galleryMediaIds.includes(mainImageId)) galleryMediaIds.unshift(mainImageId);

    const saved = await prisma.$transaction(async (tx) => {
      const previous = productId
        ? await tx.perfume.findUniqueOrThrow({ where: { id: productId }, select: { slug: true } })
        : null;
      const product = productId
        ? await tx.perfume.update({ where: { id: productId }, data: scalarData(parsed.data, formData, false) })
        : await tx.perfume.create({ data: scalarData(parsed.data, formData, true) });

      if (previous && previous.slug !== product.slug) {
        await tx.seoRedirect.upsert({
          where: { oldPath: `/product/${previous.slug}` },
          update: { newPath: `/product/${product.slug}`, statusCode: 308, isActive: true, note: 'Created automatically after product slug change' },
          create: { oldPath: `/product/${previous.slug}`, newPath: `/product/${product.slug}`, statusCode: 308, note: 'Created automatically after product slug change' },
        });
      }

      await Promise.all([
        tx.productNote.deleteMany({ where: { perfumeId: product.id } }),
        tx.productTag.deleteMany({ where: { perfumeId: product.id } }),
        tx.productMedia.deleteMany({ where: { productId: product.id } }),
      ]);
      if (noteRows.length) await tx.productNote.createMany({ data: noteRows.map((row) => ({ ...row, perfumeId: product.id })) });
      if (tagIds.length) await tx.productTag.createMany({ data: tagIds.map((tagId) => ({ perfumeId: product.id, tagId })) });
      if (galleryMediaIds.length) await tx.productMedia.createMany({
        data: galleryMediaIds.map((mediaId, sortOrder) => ({ productId: product.id, mediaId, sortOrder, isPrimary: mediaId === mainImageId })),
      });

      if (!productId && parsed.data.initialStock > 0) {
        await applyInventoryMovement(tx, {
          perfumeId: product.id,
          stockDelta: parsed.data.initialStock,
          reservedDelta: 0,
          quantityChanged: parsed.data.initialStock,
          movementType: 'INITIAL_STOCK',
          reason: 'Initial product stock',
          adminNote: 'Product created in Perfume Studio',
          adminId: admin.id,
        });
      }

      await tx.activityLog.create({ data: {
        adminId: admin.id,
        actorName: admin.name ?? admin.email,
        action: productId ? 'product.updated' : 'product.created',
        affectedType: 'Perfume',
        affectedId: product.id,
        affectedName: product.nameEn,
      } });
      await tx.auditLog.create({ data: {
        adminId: admin.id,
        action: productId ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED',
        entityType: 'Perfume',
        entityId: product.id,
        newValue: { sku: product.sku, status: product.status, slug: product.slug },
      } });
      return product;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidateTarget({ entity: 'product', slug: saved.slug });
    revalidateTarget({ entity: 'home' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'The SKU or slug is already used by another product.' };
    }
    if (error instanceof Error && /permission|Authentication|Admin account|session/i.test(error.message)) {
      return { error: error.message };
    }
    return { error: 'The product could not be saved. Check the data and database connection, then try again.' };
  }

  redirect('/studio/products?saved=1');
}

export async function createProduct(previousState = emptyState, formData: FormData) {
  return saveProduct(null, previousState, formData);
}

export async function updateProduct(productId: string, previousState: ProductActionState, formData: FormData) {
  return saveProduct(productId, previousState, formData);
}

async function uniqueProductIdentity(baseSlug: string, baseSku: string) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const slug = slugCandidate(`${baseSlug}-copy`, attempt);
    const skuSuffix = attempt === 0 ? '-COPY' : `-COPY-${attempt + 1}`;
    const sku = `${baseSku.slice(0, Math.max(1, 80 - skuSuffix.length))}${skuSuffix}`;
    const conflict = await prisma.perfume.findFirst({
      where: { OR: [{ slug }, { sku }] },
      select: { id: true },
    });
    if (!conflict) return { slug, sku };
  }
  throw new Error('Could not generate a unique product copy.');
}

export async function duplicateProduct(productId: string) {
  const input = z.string().uuid().parse(productId);
  const admin = await requirePermission('products.create');
  const source = await prisma.perfume.findUniqueOrThrow({
    where: { id: input },
    include: {
      notes: { select: { noteId: true, tier: true, strength: true, sortOrder: true } },
      tags: { select: { tagId: true } },
      galleryMedia: { select: { mediaId: true, sortOrder: true, isPrimary: true } },
    },
  });
  const identity = await uniqueProductIdentity(source.slug, source.sku);
  const copy = await prisma.$transaction(async (tx) => {
    const created = await tx.perfume.create({
      data: {
        nameEn: `${source.nameEn} Copy`, nameAr: `${source.nameAr} — نسخة`,
        slug: identity.slug, sku: identity.sku, barcode: null,
        brandId: source.brandId, categoryId: source.categoryId,
        status: 'DRAFT', publishedAt: null, archivedAt: null, deletedAt: null,
        costPrice: source.costPrice, price: source.price, oldPrice: source.oldPrice,
        discountPercent: source.discountPercent, currency: source.currency,
        stock: 0, reservedStock: 0, availableStock: 0,
        lowStockThreshold: source.lowStockThreshold, availability: 'OUT_OF_STOCK',
        inventoryStatus: 'OUT_OF_STOCK', warehouseLocation: source.warehouseLocation,
        mainImageId: source.mainImageId, videoId: source.videoId,
        shortDescriptionEn: source.shortDescriptionEn, shortDescriptionAr: source.shortDescriptionAr,
        descriptionEn: source.descriptionEn, descriptionAr: source.descriptionAr,
        storyEn: source.storyEn, storyAr: source.storyAr,
        concentration: source.concentration, gender: source.gender, bottleSize: source.bottleSize,
        releaseYear: source.releaseYear, countryOfOrigin: source.countryOfOrigin,
        scentFamilies: source.scentFamilies, longevity: source.longevity,
        projection: source.projection, sillage: source.sillage,
        season: source.season, occasion: source.occasion, style: source.style, mood: source.mood,
        metaTitleEn: source.metaTitleEn, metaTitleAr: source.metaTitleAr,
        metaDescriptionEn: source.metaDescriptionEn, metaDescriptionAr: source.metaDescriptionAr,
        keywords: source.keywords, searchAliases: source.searchAliases,
        ogImage: source.ogImage, canonicalUrl: null,
        notes: { create: source.notes.map((item) => ({ noteId: item.noteId, tier: item.tier, strength: item.strength, sortOrder: item.sortOrder })) },
        tags: { create: source.tags.map((item) => ({ tagId: item.tagId })) },
        galleryMedia: { create: source.galleryMedia.map((item) => ({ mediaId: item.mediaId, sortOrder: item.sortOrder, isPrimary: item.isPrimary })) },
      },
    });
    await Promise.all([
      tx.activityLog.create({ data: {
        adminId: admin.id, actorName: admin.name ?? admin.email, action: 'product.duplicated',
        affectedType: 'Perfume', affectedId: created.id, affectedName: created.nameEn,
        metadata: { sourceProductId: source.id },
      } }),
      tx.auditLog.create({ data: {
        adminId: admin.id, action: 'PRODUCT_DUPLICATED', entityType: 'Perfume', entityId: created.id,
        newValue: { sourceProductId: source.id, slug: created.slug, sku: created.sku, status: created.status },
      } }),
    ]);
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidateTarget({ entity: 'product', slug: copy.slug });
  return { id: copy.id };
}

export async function archiveProduct(productId: string) {
  const input = z.string().uuid().parse(productId);
  const admin = await requirePermission('products.delete');
  const previous = await prisma.perfume.findUniqueOrThrow({
    where: { id: input }, select: { id: true, nameEn: true, slug: true, status: true, deletedAt: true },
  });
  const archived = await prisma.$transaction(async (tx) => {
    const product = await tx.perfume.update({
      where: { id: input },
      data: { status: 'ARCHIVED', archivedAt: new Date(), deletedAt: new Date(), availability: 'HIDDEN', inventoryStatus: 'HIDDEN' },
    });
    await Promise.all([
      tx.activityLog.create({ data: {
        adminId: admin.id, actorName: admin.name ?? admin.email, action: 'product.archived',
        affectedType: 'Perfume', affectedId: product.id, affectedName: product.nameEn,
        previousValue: { status: previous.status, deletedAt: previous.deletedAt?.toISOString() ?? null },
        newValue: { status: product.status, deletedAt: product.deletedAt?.toISOString() ?? null },
      } }),
      tx.auditLog.create({ data: {
        adminId: admin.id, action: 'PRODUCT_ARCHIVED', entityType: 'Perfume', entityId: product.id,
        previousValue: { status: previous.status }, newValue: { status: product.status },
      } }),
    ]);
    return product;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidateTarget({ entity: 'product', slug: archived.slug });
  revalidateTarget({ entity: 'home' });
  return { id: archived.id };
}

export async function updateProductStatus(perfumeId: string, status: Status) {
  const input = z.object({ perfumeId: z.string().uuid(), status: z.enum(STATUSES) }).parse({ perfumeId, status });
  const admin = await requirePermission('products.publish');
  const perfume = await prisma.perfume.update({
    where: { id: input.perfumeId },
    data: {
      status: input.status,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      archivedAt: input.status === 'ARCHIVED' ? new Date() : null,
    },
  });
  await prisma.$transaction([
    prisma.activityLog.create({ data: {
      adminId: admin.id, actorName: admin.name ?? admin.email,
      action: `product.status.${input.status.toLowerCase()}`, affectedType: 'Perfume',
      affectedId: perfume.id, affectedName: perfume.nameEn,
    } }),
    prisma.auditLog.create({ data: {
      adminId: admin.id, action: 'PRODUCT_STATUS_CHANGED', entityType: 'Perfume',
      entityId: perfume.id, newValue: { status: input.status },
    } }),
  ]);
  revalidateTarget({ entity: 'product', slug: perfume.slug });
  revalidateTarget({ entity: 'home' });
  return perfume;
}
