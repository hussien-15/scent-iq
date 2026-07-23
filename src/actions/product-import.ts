'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import {
  parseProductImport,
  splitList,
  validateProductImport,
  type ProductImportReport,
} from '@/services/product-import.service';

export type ProductImportActionResult = {
  report?: ProductImportReport;
  imported?: number;
  error?: string;
};

const allowedExtensions = new Set(['csv', 'json', 'xls']);
const allowedTypes = new Set(['text/csv', 'application/csv', 'application/json', 'text/json', 'application/vnd.ms-excel', 'application/xml', 'text/xml', '']);

function performance(value: string) {
  const normalized = value.trim().toUpperCase();
  return ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'].includes(normalized) ? normalized as 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' : undefined;
}

function gender(value: string) {
  const normalized = value.trim().toUpperCase();
  return ['MEN', 'WOMEN', 'MASCULINE', 'FEMININE', 'UNISEX'].includes(normalized) ? normalized as 'MEN' | 'WOMEN' | 'MASCULINE' | 'FEMININE' | 'UNISEX' : 'UNISEX';
}

async function reportFor(file: File) {
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
  if (!allowedExtensions.has(extension) || !allowedTypes.has(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('Choose a CSV, JSON, or Excel XML (.xls) file smaller than 5 MB.');
  }
  const rows = parseProductImport(await file.text(), extension);
  if (!rows.length) throw new Error('The import file contains no product rows.');
  const [brands, categories, notes, tags, media, existing] = await Promise.all([
    prisma.brand.findMany({ where: { deletedAt: null }, select: { id: true, name: true, nameAr: true, slug: true, searchAliases: true } }),
    prisma.category.findMany({ where: { deletedAt: null }, select: { id: true, nameEn: true, nameAr: true, slug: true } }),
    prisma.note.findMany({ select: { id: true, nameEn: true, nameAr: true, slug: true } }),
    prisma.tag.findMany({ select: { id: true, name: true, nameAr: true, slug: true } }),
    prisma.media.findMany({ where: { folder: { not: 'seed-placeholders' } }, select: { id: true, fileName: true, originalName: true } }),
    prisma.perfume.findMany({ select: { sku: true, slug: true } }),
  ]);
  return validateProductImport(rows, {
    brands, categories, notes, tags, media,
    existingSkus: existing.map((product) => product.sku),
    existingSlugs: existing.map((product) => product.slug),
  });
}

export async function processProductImport(formData: FormData): Promise<ProductImportActionResult> {
  const admin = await requirePermission('products.create');
  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'Choose an import file.' };
  try {
    const report = await reportFor(file);
    if (formData.get('confirm') !== 'true') return { report };
    if (report.errorRows) return { report, error: 'Fix every error row before importing. No products were saved.' };

    await prisma.$transaction(async (tx) => {
      for (const row of report.rows) {
        const values = row.values;
        const stock = Number(values.Stock);
        const price = Number(values.Price);
        const oldPrice = values.OldPrice ? Number(values.OldPrice) : null;
        const discountPercent = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;
        const product = await tx.perfume.create({
          data: {
            nameAr: values.NameArabic,
            nameEn: values.NameEnglish,
            slug: row.slug,
            sku: row.sku,
            brandId: row.brandId!,
            categoryId: row.categoryId!,
            price,
            oldPrice,
            discountPercent,
            currency: 'IQD',
            stock,
            availableStock: stock,
            lowStockThreshold: Math.min(5, Math.max(1, stock)),
            availability: stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
            inventoryStatus: stock > 5 ? 'IN_STOCK' : stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
            bottleSize: values.BottleSize || null,
            gender: gender(values.Gender),
            concentration: values.Concentration || null,
            scentFamilies: splitList(values.FragranceFamilies).map((item) => item.toLowerCase()),
            season: splitList(values.Season).map((item) => item.toLowerCase()),
            occasion: splitList(values.Occasion).map((item) => item.toLowerCase()),
            style: splitList(values.Style).map((item) => item.toLowerCase()),
            mood: [],
            shortDescriptionAr: values.ShortDescriptionArabic || null,
            shortDescriptionEn: values.ShortDescriptionEnglish || null,
            descriptionAr: values.DescriptionArabic || values.ShortDescriptionArabic || values.NameArabic,
            descriptionEn: values.DescriptionEnglish || values.ShortDescriptionEnglish || values.NameEnglish,
            metaTitleAr: values.SeoTitleArabic || null,
            metaDescriptionAr: values.SeoDescriptionArabic || null,
            keywords: [],
            searchAliases: [values.NameArabic, values.NameEnglish, row.sku].filter(Boolean),
            longevity: performance(values.Longevity),
            projection: performance(values.Projection),
            sillage: performance(values.Sillage),
            status: row.effectiveStatus,
            publishedAt: row.effectiveStatus === 'PUBLISHED' ? new Date() : null,
            mainImageId: row.mediaId,
          },
        });
        const noteRows = [
          ...row.noteIds.top.map((noteId, sortOrder) => ({ perfumeId: product.id, noteId, tier: 'TOP' as const, sortOrder })),
          ...row.noteIds.heart.map((noteId, sortOrder) => ({ perfumeId: product.id, noteId, tier: 'HEART' as const, sortOrder })),
          ...row.noteIds.base.map((noteId, sortOrder) => ({ perfumeId: product.id, noteId, tier: 'BASE' as const, sortOrder })),
        ];
        if (noteRows.length) await tx.productNote.createMany({ data: noteRows, skipDuplicates: true });
        if (row.tagIds.length) await tx.productTag.createMany({ data: row.tagIds.map((tagId) => ({ perfumeId: product.id, tagId })), skipDuplicates: true });
        if (row.mediaId) await tx.productMedia.create({ data: { productId: product.id, mediaId: row.mediaId, isPrimary: true } });
        if (stock > 0) await tx.inventoryMovement.create({ data: {
          perfumeId: product.id, adminId: admin.id, previousStock: 0, newStock: stock,
          previousReserved: 0, newReserved: 0, quantityChanged: stock, movementType: 'INITIAL_STOCK',
          reason: 'Initial catalog import', adminNote: `Imported from ${file.name}`,
        } });
        await tx.activityLog.create({ data: {
          adminId: admin.id, actorName: admin.name ?? admin.email, action: 'product.imported',
          affectedType: 'Perfume', affectedId: product.id, affectedName: product.nameEn,
          metadata: { fileName: file.name, completionScore: row.completionScore, status: row.effectiveStatus },
        } });
        await tx.auditLog.create({ data: {
          adminId: admin.id, action: 'PRODUCT_IMPORTED', entityType: 'Perfume', entityId: product.id,
          newValue: { sku: product.sku, status: product.status, completionScore: row.completionScore },
        } });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
    revalidatePath('/studio/products');
    revalidatePath('/studio/inventory');
    revalidatePath('/studio/setup');
    revalidatePath('/ar');
    revalidatePath('/en');
    return { report, imported: report.rows.length };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { error: 'A SKU or slug changed after preview. Revalidate the file and try again.' };
    return { error: error instanceof Error ? error.message : 'The product import could not be processed.' };
  }
}
