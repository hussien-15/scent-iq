import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getDictionary, type Locale } from '@/lib/i18n';
import { localized } from '@/utils/localized';
import type { BrandSummary } from '@/types';
import { absoluteUrl, buildMetadata, serializeJsonLd } from '@/utils/seo';
import EmptyState from '@/components/ui/EmptyState';
import { Tags } from 'lucide-react';

export const revalidate = 900;

export async function generateMetadata({ params }: { params: { lang: Locale } }): Promise<Metadata> {
  const ar = params.lang === 'ar';
  return buildMetadata({
    title: ar ? 'علامات العطور المختارة في العراق' : 'Selected perfume brands in Iraq',
    description: ar
      ? 'تعرّف على بيوت وماركات العطور المتوفرة في ScentIQ، وقارن قصصها وأشهر عطورها قبل الشراء داخل العراق.'
      : 'Explore perfume houses available at ScentIQ and compare their stories and popular fragrances before ordering in Iraq.',
    path: '/brands',
    locale: params.lang,
    keywords: ar ? ['ماركات عطور', 'عطور في العراق', 'بيوت العطور'] : ['perfume brands Iraq', 'selected fragrances'],
  });
}

export default async function BrandsPage({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);

  const brands = await prisma.brand.findMany({
    where: { perfumes: { some: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } } } },
    include: { _count: { select: { perfumes: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: brands.map((brand, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: localized(params.lang, brand.name, brand.nameAr),
              url: absoluteUrl(`/${params.lang}/brands/${brand.slug}`),
            })),
          }),
        }}
      />
      <p className="eyebrow mb-2">{dict.brands.eyebrow}</p>
      <h1 className="mb-10 font-display text-4xl text-parchment">{dict.brands.title}</h1>

      {brands.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={params.lang === 'ar' ? 'لا توجد علامات متاحة حاليًا' : 'No brands available yet'}
          description={
            params.lang === 'ar'
              ? 'تصفّح العطور المتاحة أو عد لاحقًا لاكتشاف المزيد من البيوت العطرية.'
              : 'Browse the available perfumes or return later to discover more fragrance houses.'
          }
          action={{ label: params.lang === 'ar' ? 'تصفّح العطور' : 'Browse perfumes', href: `/${params.lang}/shop` }}
        />
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {brands.map((brand: BrandSummary) => (
            <Link
              key={brand.id}
              href={`/${params.lang}/brands/${brand.slug}`}
              className="hairline block rounded-sm p-8 transition-colors hover:border-gold/40"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl text-parchment">
                  {localized(params.lang, brand.name, brand.nameAr)}
                </h2>
                <span className="eyebrow">
                  {brand._count?.perfumes ?? 0} {dict.brands.scents}
                </span>
              </div>
              <p className="mt-1 eyebrow">{brand.originCountry}</p>
              <p className="mt-4 text-sm text-smoke">{localized(params.lang, brand.story ?? '', brand.storyAr)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
