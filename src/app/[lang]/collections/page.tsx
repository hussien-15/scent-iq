import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowUpLeft, ArrowUpRight, LibraryBig } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getDictionary, resolveLocale } from '@/lib/i18n';
import { localized } from '@/utils/localized';
import { countCollectionProducts, publicCollectionWhere } from '@/services/collection.service';
import { absoluteUrl, buildMetadata, serializeJsonLd } from '@/utils/seo';
import EmptyState from '@/components/ui/EmptyState';

export const revalidate = 900;

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const ar = params.lang === 'ar';
  return buildMetadata({
    title: ar ? 'مجموعات عطور مختارة لكل موسم ومناسبة' : 'Curated perfume collections for every season',
    description: ar
      ? 'استكشف مجموعات ScentIQ المختارة حسب الموسم والمناسبة والأداء لتجد عطرك المناسب بسهولة داخل العراق.'
      : 'Explore ScentIQ collections curated by season, occasion and performance to find the right fragrance in Iraq.',
    path: '/collections',
    locale: params.lang,
    keywords: ar ? ['مجموعات عطور', 'عطور صيفية', 'عطور شتوية'] : ['perfume collections', 'seasonal fragrances Iraq'],
  });
}

export default async function CollectionsPage(props: { params: Promise<{ lang: string }> }) {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const dict = getDictionary(params.lang);
  const collections = await prisma.collection.findMany({
    where: publicCollectionWhere(),
    orderBy: [{ featuredOnHomepage: 'desc' }, { homepageOrder: 'asc' }, { updatedAt: 'desc' }],
    include: {
      perfumes: {
        select: {
          perfumeId: true,
          position: true,
          pinned: true,
          featuredLabelEn: true,
          featuredLabelAr: true,
          featuredReasonEn: true,
          featuredReasonAr: true,
        },
      },
    },
  });
  const counts = await Promise.all(collections.map((collection) => countCollectionProducts(collection)));
  const Arrow = params.lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: collections.map((collection, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: localized(params.lang, collection.name, collection.nameAr),
              url: absoluteUrl(`/${params.lang}/collections/${collection.slug}`),
            })),
          }),
        }}
      />
      <div className="mb-12 max-w-2xl">
        <p className="eyebrow mb-2">{dict.collections.eyebrow}</p>
        <h1 className="font-display text-4xl text-parchment md:text-5xl">{dict.collections.title}</h1>
        <p className="mt-4 leading-7 text-smoke">{dict.collections.subtitle}</p>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={LibraryBig}
          title={dict.collections.empty}
          description={
            params.lang === 'ar'
              ? 'يمكنك استكشاف جميع العطور المتاحة بينما نجهّز أدلة الاختيار والمجموعات.'
              : 'Explore all available perfumes while new guides and collections are prepared.'
          }
          action={{ label: params.lang === 'ar' ? 'تصفّح العطور' : 'Browse perfumes', href: `/${params.lang}/shop` }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {collections.map((collection, index) => {
            const name = localized(params.lang, collection.name, collection.nameAr);
            const description = localized(
              params.lang,
              collection.shortDescription ?? collection.description ?? '',
              collection.shortDescriptionAr ?? collection.descriptionAr
            );

            return (
              <Link
                key={collection.id}
                href={`/${params.lang}/collections/${collection.slug}`}
                className="group relative min-h-[360px] overflow-hidden rounded-sm border border-ink-line bg-ink-soft"
              >
                {collection.coverImage ? (
                  <Image
                    src={collection.coverImage}
                    alt={localized(params.lang, collection.coverAlt ?? name, collection.coverAltAr)}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,154,62,0.22),transparent_45%),linear-gradient(135deg,#171511,#080808)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="eyebrow mb-2">
                    {counts[index]} {dict.collections.scents}
                  </p>
                  <h2 className="font-display text-3xl text-parchment">{name}</h2>
                  {description && (
                    <p className="mt-3 line-clamp-2 max-w-lg text-sm leading-6 text-smoke">{description}</p>
                  )}
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-gold-bright">
                    {dict.collections.explore} <Arrow size={15} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
