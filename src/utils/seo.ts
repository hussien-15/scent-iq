import type { Metadata } from 'next';
import { locales, type Locale } from '@/lib/i18n';

const SITE_NAME = 'ScentIQ';

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function absoluteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Builds a consistent Metadata object (title, description, canonical URL,
 * hreflang alternates, Open Graph, Twitter Card) for any locale-aware page.
 * One function so every page gets the same SEO shape instead of hand-rolling
 * `<meta>` tags per route.
 */
export function buildMetadata({
  title,
  description,
  path,
  locale,
  image,
  keywords,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string; // e.g. "/shop" or "/product/velvet-amber" — no locale prefix
  locale: Locale;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const SITE_URL = getSiteUrl();
  const canonical = `${SITE_URL}/${locale}${path}`;

  const languages = Object.fromEntries(
    locales.map((l) => [l, `${SITE_URL}/${l}${path}`])
  );

  return {
    title,
    description,
    keywords,
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question', name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
