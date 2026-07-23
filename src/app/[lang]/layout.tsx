import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { StorefrontPageTracker } from '@/components/AnalyticsTracker';
import { getDictionary, dir, resolveLocale } from '@/lib/i18n';
import { absoluteUrl, getSiteUrl, serializeJsonLd } from '@/utils/seo';
import { getMaintenanceState } from '@/services/maintenance.service';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import MaintenancePage from '@/components/MaintenancePage';
import { ToastProvider } from '@/components/ui/ToastProvider';
import SetupModeBanner from '@/components/SetupModeBanner';
import { prisma } from '@/lib/prisma';
import { parseStoreLaunch } from '@/services/store-setup.service';
import '../globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A09',
  colorScheme: 'dark',
};

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const dict = getDictionary(params.lang);
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `ScentIQ — ${dict.hero.headline}`, template: '%s | ScentIQ' },
    description: dict.hero.subtext,
    applicationName: 'ScentIQ',
    category: 'shopping',
  };
}

export default async function LangLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
  }
) {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };

  const {
    children
  } = props;

  const dict = getDictionary(params.lang);
  const [maintenance, launchSetting] = await Promise.all([
    getMaintenanceState(),
    prisma.siteSetting.findUnique({ where: { key: 'store.launch' }, select: { value: true } }).catch(() => null),
  ]);
  const launchMode = parseStoreLaunch(launchSetting?.value);
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ScentIQ',
    url: absoluteUrl(`/${params.lang}`),
    description: dict.hero.subtext,
    areaServed: { '@type': 'Country', name: 'Iraq' },
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ScentIQ',
    url: absoluteUrl(`/${params.lang}`),
    inLanguage: params.lang,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl(`/${params.lang}/shop`)}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang={params.lang} dir={dir(params.lang)}>
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          {maintenance.mode === 'STOREFRONT' ? (
            <MaintenancePage lang={params.lang} state={maintenance} />
          ) : (
            <>
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organization) }} />
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(website) }} />
              <Suspense fallback={null}>
                <StorefrontPageTracker locale={params.lang} />
              </Suspense>
              {launchMode !== 'LIVE' && <SetupModeBanner lang={params.lang} mode={launchMode} />}
              {maintenance.mode === 'ORDERING' && <MaintenanceBanner lang={params.lang} state={maintenance} />}
              <Header lang={params.lang} dict={dict} />
              <main className="flex-1">{children}</main>
              <Footer lang={params.lang} dict={dict} />
            </>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}
