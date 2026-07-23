'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export type TaxonomyActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> };
const empty: TaxonomyActionState = {};
const text = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();
const csv = (formData: FormData, key: string) => text(formData, key).split(',').map((item) => item.trim()).filter(Boolean);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);
const noteSchema = z.object({ nameEn: z.string().min(2).max(100), nameAr: z.string().min(2).max(100), slug, category: z.string().max(80).optional() });
const tagSchema = z.object({ nameEn: z.string().min(2).max(100), nameAr: z.string().max(100).optional(), slug, type: z.string().max(80).optional() });

function refreshTaxonomy(noteSlug?: string) {
  revalidatePath('/studio/taxonomy');
  revalidatePath('/studio/products/new');
  revalidatePath('/studio/collections');
  revalidatePath('/ar/shop'); revalidatePath('/en/shop'); revalidatePath('/sitemap.xml');
  if (noteSlug) { revalidatePath(`/ar/notes/${noteSlug}`); revalidatePath(`/en/notes/${noteSlug}`); }
}

async function saveNote(id: string | null, _state: TaxonomyActionState, formData: FormData): Promise<TaxonomyActionState> {
  const parsed = noteSchema.safeParse({ nameEn: text(formData, 'nameEn'), nameAr: text(formData, 'nameAr'), slug: text(formData, 'slug'), category: text(formData, 'category') || undefined });
  if (!parsed.success) return { error: 'Review the note fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const admin = await requirePermission(id ? 'taxonomy.edit' : 'taxonomy.create');
    const saved = await prisma.$transaction(async (tx) => {
      const previous = id ? await tx.note.findUniqueOrThrow({ where: { id }, select: { slug: true } }) : null;
      const data = {
        ...parsed.data, category: parsed.data.category || null,
        descriptionEn: text(formData, 'descriptionEn') || null,
        descriptionAr: text(formData, 'descriptionAr') || null,
        keywords: csv(formData, 'keywords'),
      };
      const note = id ? await tx.note.update({ where: { id }, data }) : await tx.note.create({ data });
      if (previous && previous.slug !== note.slug) await tx.seoRedirect.upsert({
        where: { oldPath: `/notes/${previous.slug}` },
        update: { newPath: `/notes/${note.slug}`, statusCode: 308, isActive: true, note: 'Created automatically after note slug change' },
        create: { oldPath: `/notes/${previous.slug}`, newPath: `/notes/${note.slug}`, statusCode: 308, note: 'Created automatically after note slug change' },
      });
      await tx.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: id ? 'note.updated' : 'note.created', affectedType: 'Note', affectedId: note.id, affectedName: note.nameEn } });
      return note;
    });
    refreshTaxonomy(saved.slug);
    return { success: id ? 'Note updated.' : 'Note created.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { error: 'The English name or slug is already used.' };
    return { error: error instanceof Error && /permission|Authentication/i.test(error.message) ? error.message : 'The note could not be saved.' };
  }
}

async function saveTag(id: string | null, _state: TaxonomyActionState, formData: FormData): Promise<TaxonomyActionState> {
  const parsed = tagSchema.safeParse({ nameEn: text(formData, 'nameEn'), nameAr: text(formData, 'nameAr') || undefined, slug: text(formData, 'slug'), type: text(formData, 'type') || undefined });
  if (!parsed.success) return { error: 'Review the tag fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const admin = await requirePermission(id ? 'taxonomy.edit' : 'taxonomy.create');
    const data = {
      name: parsed.data.nameEn, nameEn: parsed.data.nameEn, nameAr: parsed.data.nameAr || null,
      slug: parsed.data.slug, type: parsed.data.type || null,
      descriptionEn: text(formData, 'descriptionEn') || null,
      descriptionAr: text(formData, 'descriptionAr') || null,
    };
    const tag = id ? await prisma.tag.update({ where: { id }, data }) : await prisma.tag.create({ data });
    await prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: id ? 'tag.updated' : 'tag.created', affectedType: 'Tag', affectedId: tag.id, affectedName: tag.name } });
    refreshTaxonomy();
    return { success: id ? 'Tag updated.' : 'Tag created.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { error: 'The English name or slug is already used.' };
    return { error: error instanceof Error && /permission|Authentication/i.test(error.message) ? error.message : 'The tag could not be saved.' };
  }
}

export async function createNote(state = empty, formData: FormData) { return saveNote(null, state, formData); }
export async function updateNote(id: string, state: TaxonomyActionState, formData: FormData) { return saveNote(id, state, formData); }
export async function createTag(state = empty, formData: FormData) { return saveTag(null, state, formData); }
export async function updateTag(id: string, state: TaxonomyActionState, formData: FormData) { return saveTag(id, state, formData); }

export async function deleteNote(id: string): Promise<TaxonomyActionState> {
  const admin = await requirePermission('taxonomy.delete');
  const note = await prisma.note.findUniqueOrThrow({ where: { id }, include: { _count: { select: { perfumeNotes: true, favoritedBy: true } } } });
  if (note._count.perfumeNotes > 0 || note._count.favoritedBy > 0) return { error: 'This note is in use. Remove it from products and customer preferences before deleting it.' };
  await prisma.$transaction([
    prisma.note.delete({ where: { id } }),
    prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: 'note.deleted', affectedType: 'Note', affectedId: note.id, affectedName: note.nameEn } }),
  ]);
  refreshTaxonomy(note.slug);
  return { success: 'Unused note deleted.' };
}

export async function deleteTag(id: string): Promise<TaxonomyActionState> {
  const admin = await requirePermission('taxonomy.delete');
  const tag = await prisma.tag.findUniqueOrThrow({ where: { id }, include: { _count: { select: { perfumes: true } } } });
  if (tag._count.perfumes > 0) return { error: 'This tag is assigned to products. Remove those assignments before deleting it.' };
  await prisma.$transaction([
    prisma.tag.delete({ where: { id } }),
    prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: 'tag.deleted', affectedType: 'Tag', affectedId: tag.id, affectedName: tag.name } }),
  ]);
  refreshTaxonomy();
  return { success: 'Unused tag deleted.' };
}
