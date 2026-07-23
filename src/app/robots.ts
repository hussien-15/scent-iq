import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/utils/seo';
import { prisma } from '@/lib/prisma';
import { parseStoreLaunch } from '@/services/store-setup.service';
import { getMaintenanceState } from '@/services/maintenance.service';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = getSiteUrl();
  let launchStatus: 'SETUP' | 'PREVIEW' | 'LIVE' = 'SETUP';
  const maintenance = await getMaintenanceState();
  try {
    launchStatus = parseStoreLaunch((await prisma.siteSetting.findUnique({ where: { key: 'store.launch' } }))?.value);
  } catch {
    // A disconnected database is safest as non-indexable during setup.
  }
  if (launchStatus !== 'LIVE' || maintenance.mode === 'STOREFRONT') {
    return { rules: [{ userAgent: '*', disallow: '/' }], host: site };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/studio/',
          '/admin/',
          '/api/',
          '/*/cart',
          '/*/checkout',
          '/*/wishlist',
          '/*/login',
          '/*/order-confirmation/',
          '/*/shop?*',
          '/private/',
          '/internal/',
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
