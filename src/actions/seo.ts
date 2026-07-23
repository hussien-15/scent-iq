'use server';

import { revalidatePath } from 'next/cache';
import type { SeoTemplatePageType } from '@prisma/client';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { applySeoTemplate, DEFAULT_SEO_TEMPLATES, keywordsFromForm, type SeoEntityType } from '@/services/seo.service';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function nullable(formData: FormData, key: string) {
  return text(formData, key) || null;
}

async function requireAdmin() {
  return (await requirePermission('seo.edit')).id;
}

function faqs(formData: FormData) {
  return Array.from({ length: 4 }, (_, position) => ({
    questionAr: text(formData, `faqQuestionAr.${position}`),
    answerAr: text(formData, `faqAnswerAr.${position}`),
    questionEn: nullable(formData, `faqQuestionEn.${position}`),
    answerEn: nullable(formData, `faqAnswerEn.${position}`),
    position,
  })).filter((faq) => faq.questionAr && faq.answerAr);
}

const routeBase: Record<SeoEntityType, string> = {
  product: '/product', brand: '/brands', collection: '/collections', category: '/categories', note: '/notes',
};

function revalidateSeoPaths(type: SeoEntityType, oldSlug: string, newSlug: string) {
  for (const lang of ['ar', 'en']) {
    revalidatePath(`/${lang}${routeBase[type]}/${oldSlug}`);
    revalidatePath(`/${lang}${routeBase[type]}/${newSlug}`);
  }
  revalidatePath('/studio/seo');
  revalidatePath('/sitemap.xml');
}

export async function saveSeoEntity(type: SeoEntityType, id: string, formData: FormData) {
  const adminId = await requireAdmin();
  const slug = text(formData, 'slug').toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use a lowercase Latin slug with hyphens only.');
  const common = {
    slug,
    metaTitleAr: nullable(formData, 'metaTitleAr'), metaTitleEn: nullable(formData, 'metaTitleEn'),
    metaDescriptionAr: nullable(formData, 'metaDescriptionAr'), metaDescriptionEn: nullable(formData, 'metaDescriptionEn'),
    keywords: keywordsFromForm(formData.get('keywords')), ogImage: nullable(formData, 'ogImage'),
  };
  const faqRows = faqs(formData);
  let oldSlug = slug;
  let affectedName = slug;

  await prisma.$transaction(async (tx) => {
    if (type === 'product') {
      const current = await tx.perfume.findUniqueOrThrow({ where: { id }, select: { slug: true, nameEn: true } });
      oldSlug = current.slug; affectedName = current.nameEn;
      await tx.perfume.update({ where: { id }, data: { ...common, descriptionAr: text(formData, 'descriptionAr'), descriptionEn: text(formData, 'descriptionEn'), storyAr: nullable(formData, 'secondaryContentAr'), storyEn: nullable(formData, 'secondaryContentEn') } });
      if (text(formData, 'imageAltAr')) await tx.media.updateMany({ where: { perfumeId: id, isPrimary: true }, data: { altText: text(formData, 'imageAltAr') } });
      await tx.productFaq.deleteMany({ where: { perfumeId: id } });
      if (faqRows.length) await tx.productFaq.createMany({ data: faqRows.map((faq) => ({ ...faq, perfumeId: id })) });
    }
    if (type === 'brand') {
      const current = await tx.brand.findUniqueOrThrow({ where: { id }, select: { slug: true, name: true } });
      oldSlug = current.slug; affectedName = current.name;
      await tx.brand.update({ where: { id }, data: { ...common, descriptionAr: nullable(formData, 'descriptionAr'), descriptionEn: nullable(formData, 'descriptionEn'), storyAr: nullable(formData, 'secondaryContentAr'), story: nullable(formData, 'secondaryContentEn') } });
      await tx.brandFaq.deleteMany({ where: { brandId: id } });
      if (faqRows.length) await tx.brandFaq.createMany({ data: faqRows.map((faq) => ({ ...faq, brandId: id })) });
    }
    if (type === 'collection') {
      const current = await tx.collection.findUniqueOrThrow({ where: { id }, select: { slug: true, name: true } });
      oldSlug = current.slug; affectedName = current.name;
      const { ogImage, ...collectionCommon } = common;
      await tx.collection.update({ where: { id }, data: { ...collectionCommon, ogImage, descriptionAr: nullable(formData, 'descriptionAr'), description: nullable(formData, 'descriptionEn'), buyingGuideAr: nullable(formData, 'secondaryContentAr'), buyingGuide: nullable(formData, 'secondaryContentEn'), coverAltAr: nullable(formData, 'imageAltAr') } });
      await tx.collectionFaq.deleteMany({ where: { collectionId: id } });
      if (faqRows.length) await tx.collectionFaq.createMany({ data: faqRows.map((faq) => ({ collectionId: id, position: faq.position, questionAr: faq.questionAr, answerAr: faq.answerAr, questionEn: faq.questionEn ?? faq.questionAr, answerEn: faq.answerEn ?? faq.answerAr })) });
    }
    if (type === 'category') {
      const current = await tx.category.findUniqueOrThrow({ where: { id }, select: { slug: true, nameEn: true } });
      oldSlug = current.slug; affectedName = current.nameEn;
      await tx.category.update({ where: { id }, data: { ...common, descriptionAr: nullable(formData, 'descriptionAr'), descriptionEn: nullable(formData, 'descriptionEn'), seoContentAr: nullable(formData, 'secondaryContentAr'), seoContentEn: nullable(formData, 'secondaryContentEn') } });
      await tx.categoryFaq.deleteMany({ where: { categoryId: id } });
      if (faqRows.length) await tx.categoryFaq.createMany({ data: faqRows.map((faq) => ({ ...faq, categoryId: id })) });
    }
    if (type === 'note') {
      const current = await tx.note.findUniqueOrThrow({ where: { id }, select: { slug: true, nameEn: true } });
      oldSlug = current.slug; affectedName = current.nameEn;
      await tx.note.update({ where: { id }, data: { ...common, descriptionAr: nullable(formData, 'descriptionAr'), descriptionEn: nullable(formData, 'descriptionEn') } });
      await tx.noteFaq.deleteMany({ where: { noteId: id } });
      if (faqRows.length) await tx.noteFaq.createMany({ data: faqRows.map((faq) => ({ ...faq, noteId: id })) });
    }

    if (oldSlug !== slug) {
      await tx.seoRedirect.upsert({
        where: { oldPath: `${routeBase[type]}/${oldSlug}` },
        update: { newPath: `${routeBase[type]}/${slug}`, statusCode: 308, isActive: true, note: `Created automatically after ${type} slug change` },
        create: { oldPath: `${routeBase[type]}/${oldSlug}`, newPath: `${routeBase[type]}/${slug}`, statusCode: 308, note: `Created automatically after ${type} slug change` },
      });
    }
    await tx.activityLog.create({ data: { adminId, action: `seo.${type}.updated`, affectedType: type, affectedId: id, affectedName } });
  });

  revalidateSeoPaths(type, oldSlug, slug);
}

export async function saveHomepageSeo(formData: FormData) {
  const adminId = await requireAdmin();
  const values = {
    'seo.home.titleAr': text(formData, 'titleAr'), 'seo.home.titleEn': text(formData, 'titleEn'),
    'seo.home.descriptionAr': text(formData, 'descriptionAr'), 'seo.home.descriptionEn': text(formData, 'descriptionEn'),
    'seo.home.keywords': text(formData, 'keywords'), 'seo.home.ogImage': text(formData, 'ogImage'),
  };
  await prisma.$transaction(Object.entries(values).map(([key, value]) => prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value, group: 'seo' } })));
  await prisma.activityLog.create({ data: { adminId, action: 'seo.home.updated', affectedType: 'HomepageSEO', affectedId: 'homepage', affectedName: 'Homepage metadata' } });
  revalidatePath('/ar'); revalidatePath('/en'); revalidatePath('/studio/seo');
}

export async function saveSeoTemplate(pageType: SeoTemplatePageType, formData: FormData) {
  const adminId = await requireAdmin();
  await prisma.seoTemplate.upsert({
    where: { pageType },
    update: { titleTemplateAr: text(formData, 'titleTemplateAr'), titleTemplateEn: nullable(formData, 'titleTemplateEn'), descriptionTemplateAr: text(formData, 'descriptionTemplateAr'), descriptionTemplateEn: nullable(formData, 'descriptionTemplateEn') },
    create: { pageType, titleTemplateAr: text(formData, 'titleTemplateAr'), titleTemplateEn: nullable(formData, 'titleTemplateEn'), descriptionTemplateAr: text(formData, 'descriptionTemplateAr'), descriptionTemplateEn: nullable(formData, 'descriptionTemplateEn') },
  });
  await prisma.activityLog.create({ data: { adminId, action: 'seo.template.updated', affectedType: 'SeoTemplate', affectedId: pageType, affectedName: pageType } });
  revalidatePath('/studio/seo');
}

export async function createSeoRedirect(formData: FormData) {
  const adminId = await requireAdmin();
  const oldPath = `/${text(formData, 'oldPath').replace(/^\/+/, '')}`;
  const newPath = `/${text(formData, 'newPath').replace(/^\/+/, '')}`;
  if (oldPath === newPath) throw new Error('Old and new paths must differ.');
  await prisma.seoRedirect.upsert({ where: { oldPath }, update: { newPath, isActive: true, note: nullable(formData, 'note') }, create: { oldPath, newPath, note: nullable(formData, 'note') } });
  await prisma.activityLog.create({ data: { adminId, action: 'seo.redirect.saved', affectedType: 'SeoRedirect', affectedId: oldPath, affectedName: `${oldPath} → ${newPath}` } });
  revalidatePath('/studio/seo');
}

export async function deleteSeoRedirect(id: string) {
  const adminId = await requireAdmin();
  const deleted = await prisma.seoRedirect.delete({ where: { id } });
  await prisma.activityLog.create({ data: { adminId, action: 'seo.redirect.deleted', affectedType: 'SeoRedirect', affectedId: id, affectedName: deleted.oldPath } });
  revalidatePath('/studio/seo');
}

export async function applyMissingSeoTemplates() {
  const adminId = await requireAdmin();
  const [templates, products, brands, collections, categories, notes] = await Promise.all([
    prisma.seoTemplate.findMany(),
    prisma.perfume.findMany({ include: { brand: { select: { name: true, nameAr: true } } } }),
    prisma.brand.findMany(), prisma.collection.findMany(), prisma.category.findMany(), prisma.note.findMany(),
  ]);
  const templateMap = new Map(templates.map((template) => [template.pageType, template]));
  const getTemplate = (type: keyof typeof DEFAULT_SEO_TEMPLATES) => templateMap.get(type) ?? {
    titleTemplateAr: DEFAULT_SEO_TEMPLATES[type].titleAr, titleTemplateEn: DEFAULT_SEO_TEMPLATES[type].titleEn,
    descriptionTemplateAr: DEFAULT_SEO_TEMPLATES[type].descriptionAr, descriptionTemplateEn: DEFAULT_SEO_TEMPLATES[type].descriptionEn,
  };
  const operations = [
    ...products.map((product) => { const t = getTemplate('PRODUCT'); const values = { productName: product.nameAr, brandName: product.brand.nameAr ?? product.brand.name }; return prisma.perfume.update({ where: { id: product.id }, data: { metaTitleAr: product.metaTitleAr ?? applySeoTemplate(t.titleTemplateAr, values), metaTitleEn: product.metaTitleEn ?? applySeoTemplate(t.titleTemplateEn ?? '', { productName: product.nameEn, brandName: product.brand.name }), metaDescriptionAr: product.metaDescriptionAr ?? applySeoTemplate(t.descriptionTemplateAr, values), metaDescriptionEn: product.metaDescriptionEn ?? applySeoTemplate(t.descriptionTemplateEn ?? '', { productName: product.nameEn, brandName: product.brand.name }) } }); }),
    ...brands.map((brand) => { const t = getTemplate('BRAND'); return prisma.brand.update({ where: { id: brand.id }, data: { metaTitleAr: brand.metaTitleAr ?? applySeoTemplate(t.titleTemplateAr, { brandName: brand.nameAr ?? brand.name }), metaTitleEn: brand.metaTitleEn ?? applySeoTemplate(t.titleTemplateEn ?? '', { brandName: brand.name }), metaDescriptionAr: brand.metaDescriptionAr ?? applySeoTemplate(t.descriptionTemplateAr, { brandName: brand.nameAr ?? brand.name }), metaDescriptionEn: brand.metaDescriptionEn ?? applySeoTemplate(t.descriptionTemplateEn ?? '', { brandName: brand.name }) } }); }),
    ...collections.map((collection) => { const t = getTemplate('COLLECTION'); return prisma.collection.update({ where: { id: collection.id }, data: { metaTitleAr: collection.metaTitleAr ?? applySeoTemplate(t.titleTemplateAr, { collectionName: collection.nameAr ?? collection.name }), metaTitleEn: collection.metaTitleEn ?? applySeoTemplate(t.titleTemplateEn ?? '', { collectionName: collection.name }), metaDescriptionAr: collection.metaDescriptionAr ?? applySeoTemplate(t.descriptionTemplateAr, { collectionName: collection.nameAr ?? collection.name }), metaDescriptionEn: collection.metaDescriptionEn ?? applySeoTemplate(t.descriptionTemplateEn ?? '', { collectionName: collection.name }) } }); }),
    ...categories.map((category) => { const t = getTemplate('CATEGORY'); return prisma.category.update({ where: { id: category.id }, data: { metaTitleAr: category.metaTitleAr ?? applySeoTemplate(t.titleTemplateAr, { categoryName: category.nameAr }), metaTitleEn: category.metaTitleEn ?? applySeoTemplate(t.titleTemplateEn ?? '', { categoryName: category.nameEn }), metaDescriptionAr: category.metaDescriptionAr ?? applySeoTemplate(t.descriptionTemplateAr, { categoryName: category.nameAr }), metaDescriptionEn: category.metaDescriptionEn ?? applySeoTemplate(t.descriptionTemplateEn ?? '', { categoryName: category.nameEn }) } }); }),
    ...notes.map((note) => { const t = getTemplate('NOTE'); return prisma.note.update({ where: { id: note.id }, data: { metaTitleAr: note.metaTitleAr ?? applySeoTemplate(t.titleTemplateAr, { noteName: note.nameAr }), metaTitleEn: note.metaTitleEn ?? applySeoTemplate(t.titleTemplateEn ?? '', { noteName: note.nameEn }), metaDescriptionAr: note.metaDescriptionAr ?? applySeoTemplate(t.descriptionTemplateAr, { noteName: note.nameAr }), metaDescriptionEn: note.metaDescriptionEn ?? applySeoTemplate(t.descriptionTemplateEn ?? '', { noteName: note.nameEn }) } }); }),
  ];
  if (operations.length) await prisma.$transaction(operations);
  await prisma.activityLog.create({ data: { adminId, action: 'seo.templates.bulk_applied', affectedType: 'SEO', affectedId: 'bulk', affectedName: `${operations.length} entities` } });
  revalidatePath('/studio/seo'); revalidatePath('/sitemap.xml');
  for (const lang of ['ar', 'en']) { revalidatePath(`/${lang}`); revalidatePath(`/${lang}/shop`); }
}
