'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { getLaunchReadiness } from '@/services/qa.service';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(3).max(160),
  currency: z.enum(['IQD', 'USD']),
  primaryLanguage: z.enum(['ar', 'en']),
  launchStatus: z.enum(['SETUP', 'PREVIEW', 'LIVE']),
});

export type SetupActionState = { success?: boolean; error?: string };

export async function saveStoreSetup(_state: SetupActionState, formData: FormData): Promise<SetupActionState> {
  const admin = await requirePermission('settings.edit');
  const parsed = schema.safeParse({
    name: String(formData.get('name') ?? ''),
    tagline: String(formData.get('tagline') ?? ''),
    currency: String(formData.get('currency') ?? ''),
    primaryLanguage: String(formData.get('primaryLanguage') ?? ''),
    launchStatus: String(formData.get('launchStatus') ?? ''),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Review the setup fields.' };

  if (parsed.data.launchStatus === 'LIVE') {
    const [products, deliveryCompanies, seoTemplates, approvedMedia] = await Promise.all([
      prisma.perfume.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      prisma.deliveryCompany.count({ where: { status: 'ACTIVE', fees: { some: {} } } }),
      prisma.seoTemplate.count(),
      prisma.media.count({
        where: { folder: { not: 'seed-placeholders' }, type: { in: ['IMAGE', 'LOGO', 'BANNER'] } },
      }),
    ]);
    const missing = [
      !products && 'at least one published real product',
      !deliveryCompanies && 'an active delivery company with fees',
      seoTemplates < 5 && 'all SEO templates',
      !approvedMedia && 'approved non-placeholder media',
    ].filter(Boolean);
    if (missing.length) return { error: `Live Mode is blocked until you add ${missing.join(', ')}.` };
    const readiness = await getLaunchReadiness();
    if (!readiness.ready) {
      return {
        error: `Live Mode is blocked by Final QA: ${readiness.blockers.slice(0, 4).join(' ')}`,
      };
    }
  }

  const previous = await prisma.siteSetting.findUnique({ where: { key: 'store.launch' } });
  const previousValue = previous?.value === null ? Prisma.JsonNull : previous?.value;
  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: 'site.identity' },
      update: {
        value: { name: parsed.data.name, tagline: parsed.data.tagline, market: 'Iraq' },
        group: 'site_identity',
      },
      create: {
        key: 'site.identity',
        value: { name: parsed.data.name, tagline: parsed.data.tagline, market: 'Iraq' },
        group: 'site_identity',
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: 'commerce.currency' },
      update: {
        value: { code: parsed.data.currency, decimals: parsed.data.currency === 'IQD' ? 0 : 2 },
        group: 'commerce',
      },
      create: {
        key: 'commerce.currency',
        value: { code: parsed.data.currency, decimals: parsed.data.currency === 'IQD' ? 0 : 2 },
        group: 'commerce',
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: 'site.languages' },
      update: {
        value: {
          primary: parsed.data.primaryLanguage,
          secondary: parsed.data.primaryLanguage === 'ar' ? 'en' : 'ar',
          enabled: ['ar', 'en'],
          rtl: true,
        },
        group: 'languages',
      },
      create: {
        key: 'site.languages',
        value: {
          primary: parsed.data.primaryLanguage,
          secondary: parsed.data.primaryLanguage === 'ar' ? 'en' : 'ar',
          enabled: ['ar', 'en'],
          rtl: true,
        },
        group: 'languages',
      },
    }),
    prisma.siteSetting.upsert({
      where: { key: 'store.launch' },
      update: {
        value: {
          status: parsed.data.launchStatus,
          indexable: parsed.data.launchStatus === 'LIVE',
          publishedAt: parsed.data.launchStatus === 'LIVE' ? new Date().toISOString() : null,
        },
        group: 'launch',
      },
      create: {
        key: 'store.launch',
        value: {
          status: parsed.data.launchStatus,
          indexable: parsed.data.launchStatus === 'LIVE',
          publishedAt: parsed.data.launchStatus === 'LIVE' ? new Date().toISOString() : null,
        },
        group: 'launch',
      },
    }),
    prisma.activityLog.create({
      data: {
        adminId: admin.id,
        actorName: admin.name ?? admin.email,
        action: 'store.setup.updated',
        affectedType: 'SiteSetting',
        affectedId: 'store.launch',
        affectedName: 'Store setup',
        previousValue,
        newValue: {
          status: parsed.data.launchStatus,
          currency: parsed.data.currency,
          primaryLanguage: parsed.data.primaryLanguage,
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'STORE_SETUP_UPDATED',
        entityType: 'SiteSetting',
        entityId: 'store.launch',
        previousValue,
        newValue: {
          status: parsed.data.launchStatus,
          currency: parsed.data.currency,
          primaryLanguage: parsed.data.primaryLanguage,
        },
      },
    }),
  ]);
  for (const path of [
    '/studio',
    '/studio/setup',
    '/studio/qa',
    '/studio/settings',
    '/studio/system-health',
    '/robots.txt',
    '/sitemap.xml',
    '/ar',
    '/en',
  ])
    revalidatePath(path);
  return { success: true };
}

export async function saveHomepageSection(sectionId: string, formData: FormData) {
  const admin = await requirePermission('settings.edit');
  const parsed = z
    .object({
      id: z.string().uuid(),
      titleAr: z.string().trim().max(160),
      titleEn: z.string().trim().max(160),
      descriptionAr: z.string().trim().max(500),
      descriptionEn: z.string().trim().max(500),
      sortOrder: z.coerce.number().int().min(0).max(1000),
      enabled: z.boolean(),
    })
    .parse({
      id: sectionId,
      titleAr: String(formData.get('titleAr') ?? ''),
      titleEn: String(formData.get('titleEn') ?? ''),
      descriptionAr: String(formData.get('descriptionAr') ?? ''),
      descriptionEn: String(formData.get('descriptionEn') ?? ''),
      sortOrder: formData.get('sortOrder'),
      enabled: formData.get('enabled') === 'on',
    });
  const current = await prisma.homepageSection.findUniqueOrThrow({ where: { id: parsed.id } });
  const updated = await prisma.homepageSection.update({
    where: { id: parsed.id },
    data: {
      titleAr: parsed.titleAr || null,
      titleEn: parsed.titleEn || null,
      descriptionAr: parsed.descriptionAr || null,
      descriptionEn: parsed.descriptionEn || null,
      sortOrder: parsed.sortOrder,
      enabled: parsed.enabled,
    },
  });
  await prisma.activityLog.create({
    data: {
      adminId: admin.id,
      actorName: admin.name ?? admin.email,
      action: 'homepage.section.updated',
      affectedType: 'HomepageSection',
      affectedId: updated.id,
      affectedName: updated.type,
      previousValue: { enabled: current.enabled, sortOrder: current.sortOrder },
      newValue: { enabled: updated.enabled, sortOrder: updated.sortOrder },
    },
  });
  revalidatePath('/studio/settings');
  revalidatePath('/studio/setup');
  revalidatePath('/ar');
  revalidatePath('/en');
}
