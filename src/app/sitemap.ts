import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/utils/seo';
import { parseStoreLaunch } from '@/services/store-setup.service';
import { getMaintenanceState } from '@/services/maintenance.service';

// Kept dynamic so deployments can build before the production database is
// reachable. Admin mutations revalidate this route, and the host may cache the
// successful response at the edge.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const maintenance = await getMaintenanceState();
  if (maintenance.mode === 'STOREFRONT') return [];
  const [launch, products, brands, collections, categories, notes, articles] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: 'store.launch' }, select: { value: true } }),
    prisma.perfume.findMany({
      where: { status: 'PUBLISHED', availability: { notIn: ['HIDDEN', 'DISCONTINUED'] } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.brand.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.note.findMany({
      where: { perfumeNotes: { some: { perfume: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } } } } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.editorialArticle.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
  ]);
  if (parseStoreLaunch(launch?.value) !== 'LIVE') return [];
  const staticPaths = ['', '/shop', '/brands', '/collections', '/about', '/shipping', '/contact'];
  const rows: MetadataRoute.Sitemap = [];
  for (const lang of ['ar', 'en']) {
    rows.push(
      ...staticPaths.map((path) => ({
        url: `${site}/${lang}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' ? ('daily' as const) : ('weekly' as const),
        priority: path === '' ? 1 : 0.7,
        alternates: { languages: { ar: `${site}/ar${path}`, en: `${site}/en${path}` } },
      }))
    );
    rows.push(
      ...products.map((row) => ({
        url: `${site}/${lang}/product/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }))
    );
    rows.push(
      ...brands.map((row) => ({
        url: `${site}/${lang}/brands/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    );
    rows.push(
      ...collections.map((row) => ({
        url: `${site}/${lang}/collections/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }))
    );
    rows.push(
      ...categories.map((row) => ({
        url: `${site}/${lang}/categories/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    );
    rows.push(
      ...notes.map((row) => ({
        url: `${site}/${lang}/notes/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }))
    );
    rows.push(
      ...articles.map((row) => ({
        url: `${site}/${lang}/guides/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      }))
    );
  }
  return rows;
}
