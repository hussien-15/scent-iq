'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { revalidateTarget } from '@/services/revalidation.service';

export type CatalogActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> };
const emptyState: CatalogActionState = {};
const text = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();
const csv = (formData: FormData, key: string) => text(formData, key).split(',').map((item) => item.trim()).filter(Boolean);

const brandSchema = z.object({
  name: z.string().min(2).max(120), nameAr: z.string().max(120).optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  originCountry: z.string().max(100).optional(), foundedYear: z.number().int().min(1500).max(2100).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED']),
});

const categorySchema = z.object({
  nameEn: z.string().min(2).max(120), nameAr: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED']),
  sortOrder: z.number().int().min(0).max(100000), parentId: z.string().uuid().optional(),
});

function refreshCatalog(kind: 'brand' | 'category', slug: string) {
  revalidatePath(`/studio/${kind === 'brand' ? 'brands' : 'categories'}`);
  revalidatePath('/ar/shop'); revalidatePath('/en/shop'); revalidatePath('/sitemap.xml');
  if (kind === 'brand') revalidateTarget({ entity: 'brand', slug });
}

async function persistBrand(id: string | null, _state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const foundedYearRaw = text(formData, 'foundedYear');
  const parsed = brandSchema.safeParse({ name: text(formData, 'name'), nameAr: text(formData, 'nameAr') || undefined, slug: text(formData, 'slug'), originCountry: text(formData, 'originCountry') || undefined, foundedYear: foundedYearRaw ? Number(foundedYearRaw) : undefined, status: text(formData, 'status') });
  if (!parsed.success) return { error: 'Review the brand fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const admin = await requirePermission(id ? 'brands.edit' : 'brands.create');
    const data = {
      ...parsed.data, nameAr: parsed.data.nameAr || null, originCountry: parsed.data.originCountry || null,
      descriptionEn: text(formData, 'descriptionEn') || null, descriptionAr: text(formData, 'descriptionAr') || null,
      logoUrl: text(formData, 'logoUrl') || null, website: text(formData, 'website') || null,
      characteristics: csv(formData, 'characteristics'), searchAliases: csv(formData, 'searchAliases'),
      isFeatured: formData.get('isFeatured') === 'on', deletedAt: null,
    };
    const brand = await prisma.$transaction(async (tx) => {
      const previous = id ? await tx.brand.findUniqueOrThrow({ where: { id }, select: { slug: true } }) : null;
      const saved = id ? await tx.brand.update({ where: { id }, data }) : await tx.brand.create({ data });
      if (previous && previous.slug !== saved.slug) await tx.seoRedirect.upsert({
        where: { oldPath: `/brands/${previous.slug}` },
        update: { newPath: `/brands/${saved.slug}`, statusCode: 308, isActive: true, note: 'Created automatically after brand slug change' },
        create: { oldPath: `/brands/${previous.slug}`, newPath: `/brands/${saved.slug}`, statusCode: 308, note: 'Created automatically after brand slug change' },
      });
      await tx.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: id ? 'brand.updated' : 'brand.created', affectedType: 'Brand', affectedId: saved.id, affectedName: saved.name } });
      return saved;
    });
    refreshCatalog('brand', brand.slug);
    return { success: id ? 'Brand updated.' : 'Brand created.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { error: 'This brand slug is already in use.' };
    return { error: error instanceof Error && /permission|Authentication/i.test(error.message) ? error.message : 'The brand could not be saved.' };
  }
}

async function persistCategory(id: string | null, _state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const parsed = categorySchema.safeParse({ nameEn: text(formData, 'nameEn'), nameAr: text(formData, 'nameAr'), slug: text(formData, 'slug'), status: text(formData, 'status'), sortOrder: Number(text(formData, 'sortOrder') || 0), parentId: text(formData, 'parentId') || undefined });
  if (!parsed.success) return { error: 'Review the category fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const admin = await requirePermission(id ? 'categories.edit' : 'categories.create');
    const data = {
      ...parsed.data, parentId: parsed.data.parentId || null, descriptionEn: text(formData, 'descriptionEn') || null,
      descriptionAr: text(formData, 'descriptionAr') || null, keywords: csv(formData, 'keywords'),
      ogImage: text(formData, 'ogImage') || null, deletedAt: null,
    };
    const category = await prisma.$transaction(async (tx) => {
      const previous = id ? await tx.category.findUniqueOrThrow({ where: { id }, select: { slug: true } }) : null;
      const saved = id ? await tx.category.update({ where: { id }, data }) : await tx.category.create({ data });
      if (previous && previous.slug !== saved.slug) await tx.seoRedirect.upsert({
        where: { oldPath: `/categories/${previous.slug}` },
        update: { newPath: `/categories/${saved.slug}`, statusCode: 308, isActive: true, note: 'Created automatically after category slug change' },
        create: { oldPath: `/categories/${previous.slug}`, newPath: `/categories/${saved.slug}`, statusCode: 308, note: 'Created automatically after category slug change' },
      });
      await tx.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: id ? 'category.updated' : 'category.created', affectedType: 'Category', affectedId: saved.id, affectedName: saved.nameEn } });
      return saved;
    });
    refreshCatalog('category', category.slug);
    return { success: id ? 'Category updated.' : 'Category created.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { error: 'This category slug is already in use.' };
    return { error: error instanceof Error && /permission|Authentication/i.test(error.message) ? error.message : 'The category could not be saved.' };
  }
}

export async function createBrand(state = emptyState, formData: FormData) { return persistBrand(null, state, formData); }
export async function updateBrand(id: string, state: CatalogActionState, formData: FormData) { return persistBrand(id, state, formData); }
export async function createCategory(state = emptyState, formData: FormData) { return persistCategory(null, state, formData); }
export async function updateCategory(id: string, state: CatalogActionState, formData: FormData) { return persistCategory(id, state, formData); }

export async function archiveBrand(id: string) {
  const admin = await requirePermission('brands.delete');
  const brand = await prisma.brand.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: 'brand.archived', affectedType: 'Brand', affectedId: brand.id, affectedName: brand.name } });
  refreshCatalog('brand', brand.slug);
}

export async function archiveCategory(id: string) {
  const admin = await requirePermission('categories.delete');
  const category = await prisma.category.update({ where: { id }, data: { status: 'ARCHIVED', deletedAt: new Date() } });
  await prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: 'category.archived', affectedType: 'Category', affectedId: category.id, affectedName: category.nameEn } });
  refreshCatalog('category', category.slug);
}
