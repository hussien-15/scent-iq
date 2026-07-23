import Link from 'next/link';
import Image from 'next/image';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getDictionary, type Locale } from '@/lib/i18n';
import { localized } from '@/utils/localized';
import Breadcrumb from '@/components/Breadcrumb';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd, serializeJsonLd } from '@/utils/seo';
import { tagLabel } from '@/lib/tag-labels';
import CollectionTracker from '@/components/collections/CollectionTracker';
import CollectionProductCard, { type CollectionCardProduct } from '@/components/collections/CollectionProductCard';
import {
  COLLECTION_FAMILIES,
  COLLECTION_OCCASIONS,
  COLLECTION_SEASONS,
  PERFORMANCE_LEVELS,
  getCollectionProducts,
  publicCollectionWhere,
  type CollectionFilters,
} from '@/services/collection.service';

export const revalidate = 900;
export const dynamicParams = true;

// Build collection pages on first request, then revalidate them every 15 minutes.
// Returning an empty list keeps builds independent from the private production DB.
export async function generateStaticParams() {
  return [];
}

const findPublicCollection = cache(async (slug: string) => {
  return prisma.collection.findFirst({
    where: { slug, ...publicCollectionWhere() },
    include: {
      perfumes: {
        orderBy: { position: 'asc' },
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
      faqs: { orderBy: { position: 'asc' } },
      relatedFrom: {
        orderBy: { position: 'asc' },
        where: { relatedCollection: publicCollectionWhere() },
        include: { relatedCollection: true },
      },
    },
  });
});

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string; lang: Locale };
  searchParams: CollectionFilters;
}): Promise<Metadata> {
  const collection = await findPublicCollection(params.slug);
  if (!collection) return {};

  const title = localized(
    params.lang,
    collection.metaTitleEn ?? collection.name,
    collection.metaTitleAr ?? collection.nameAr
  );
  const description = localized(
    params.lang,
    collection.metaDescriptionEn ?? collection.shortDescription ?? collection.description ?? '',
    collection.metaDescriptionAr ?? collection.shortDescriptionAr ?? collection.descriptionAr
  );

  return buildMetadata({
    title,
    description,
    path: `/collections/${collection.slug}`,
    locale: params.lang,
    image: collection.ogImage ?? collection.coverImage ?? undefined,
    keywords: collection.keywords,
    noIndex: Object.values(searchParams).some(Boolean),
  });
}

function toCardProduct(product: Awaited<ReturnType<typeof getCollectionProducts>>['products'][number]): CollectionCardProduct {
  return {
    id: product.id,
    slug: product.slug,
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    price: Number(product.price),
    oldPrice: product.oldPrice == null ? null : Number(product.oldPrice),
    currency: product.currency,
    concentration: product.concentration,
    availability: product.availability,
    stock: product.stock,
    available: product.variants.length
      ? product.variants.reduce((sum, variant) => sum + Math.max(0, variant.stock - variant.reservedStock), 0)
      : Math.max(0, product.stock - product.reservedStock),
    hasVariants: product.variants.length > 0,
    avgRating: product.avgRating,
    brand: product.brand,
    featuredLabelEn: product.collectionPlacement?.featuredLabelEn,
    featuredLabelAr: product.collectionPlacement?.featuredLabelAr,
    featuredReasonEn: product.collectionPlacement?.featuredReasonEn,
    featuredReasonAr: product.collectionPlacement?.featuredReasonAr,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { slug: string; lang: Locale };
  searchParams: CollectionFilters;
}) {
  const collection = await findPublicCollection(params.slug);
  if (!collection) notFound();

  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const collectionSlug = collection.slug;
  const [{ products, featured, total, page, totalPages }, brands, notes] = await Promise.all([
    getCollectionProducts(collection, searchParams),
    prisma.brand.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, nameAr: true } }),
    prisma.note.findMany({ orderBy: { nameEn: 'asc' }, select: { id: true, nameEn: true, nameAr: true } }),
  ]);

  const name = localized(lang, collection.name, collection.nameAr);
  const shortDescription = localized(lang, collection.shortDescription ?? '', collection.shortDescriptionAr);
  const description = localized(lang, collection.description ?? '', collection.descriptionAr);
  const buyingGuide = localized(lang, collection.buyingGuide ?? '', collection.buyingGuideAr);
  const faqItems = collection.faqs
    .map((faq) => ({
      question: localized(lang, faq.questionEn, faq.questionAr),
      answer: localized(lang, faq.answerEn, faq.answerAr),
    }))
    .filter((faq) => faq.question && faq.answer);
  const hasFilters = Object.entries(searchParams).some(([key, value]) => key !== 'sort' && key !== 'page' && Boolean(value));

  function pageHref(nextPage: number) {
    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') query.set(key, value);
    });
    query.set('page', String(nextPage));
    return `/${lang}/collections/${collectionSlug}?${query.toString()}`;
  }

  function FilterFields() {
    const selectClass = 'w-full rounded-sm border border-ink-line bg-ink px-3 py-2.5 text-xs text-parchment focus:border-gold/50 focus:outline-none';
    const labelClass = 'mb-1.5 block text-[11px] text-smoke';
    const option = (value: string, label: string) => <option key={value} value={value}>{label}</option>;

    return (
      <>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
          <label><span className={labelClass}>{dict.collections.filter.brand}</span><select name="brand" defaultValue={searchParams.brand ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{brands.map((brand) => option(brand.id, localized(lang, brand.name, brand.nameAr)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.gender}</span><select name="gender" defaultValue={searchParams.gender ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{['MASCULINE', 'FEMININE', 'UNISEX'].map((value) => option(value, tagLabel(value, lang)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.family}</span><select name="family" defaultValue={searchParams.family ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{COLLECTION_FAMILIES.map((value) => option(value, tagLabel(value, lang)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.season}</span><select name="season" defaultValue={searchParams.season ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{COLLECTION_SEASONS.map((value) => option(value, tagLabel(value, lang)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.occasion}</span><select name="occasion" defaultValue={searchParams.occasion ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{COLLECTION_OCCASIONS.map((value) => option(value, tagLabel(value, lang)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.note}</span><select name="note" defaultValue={searchParams.note ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{notes.map((note) => option(note.id, localized(lang, note.nameEn, note.nameAr)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.longevity}</span><select name="longevity" defaultValue={searchParams.longevity ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{PERFORMANCE_LEVELS.map((value) => option(value, tagLabel(value, lang)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.projection}</span><select name="projection" defaultValue={searchParams.projection ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{PERFORMANCE_LEVELS.map((value) => option(value, tagLabel(value, lang)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.sillage}</span><select name="sillage" defaultValue={searchParams.sillage ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{PERFORMANCE_LEVELS.map((value) => option(value, tagLabel(value, lang)))}</select></label>
          <label><span className={labelClass}>{dict.collections.filter.availability}</span><select name="availability" defaultValue={searchParams.availability ?? ''} className={selectClass}><option value="">{dict.collections.filter.all}</option>{option('IN_STOCK', dict.collections.availability.inStock)}{option('PREORDER', dict.collections.availability.preorder)}{option('OUT_OF_STOCK', dict.collections.availability.outOfStock)}</select></label>
          <div className="grid grid-cols-2 gap-2">
            <label><span className={labelClass}>{dict.collections.filter.priceMin}</span><input type="number" min="0" name="minPrice" defaultValue={searchParams.minPrice ?? ''} className={selectClass} /></label>
            <label><span className={labelClass}>{dict.collections.filter.priceMax}</span><input type="number" min="0" name="maxPrice" defaultValue={searchParams.maxPrice ?? ''} className={selectClass} /></label>
          </div>
          <label className="flex items-center gap-2 text-xs text-smoke"><input type="checkbox" name="discount" value="true" defaultChecked={searchParams.discount === 'true'} className="accent-gold" />{dict.collections.filter.discounted}</label>
          <label><span className={labelClass}>{dict.collections.sort.label}</span><select name="sort" defaultValue={searchParams.sort ?? 'featured'} className={selectClass}>{option('featured', dict.collections.sort.featured)}{option('best-selling', dict.collections.sort.bestSelling)}{option('popular', dict.collections.sort.popular)}{option('newest', dict.collections.sort.newest)}{option('price-asc', dict.collections.sort.priceAsc)}{option('price-desc', dict.collections.sort.priceDesc)}{option('best-rated', dict.collections.sort.bestRated)}{option('strongest', dict.collections.sort.strongest)}</select></label>
        </div>
        <button type="submit" className="mt-4 w-full rounded-full bg-gold px-4 py-2.5 text-xs font-medium text-ink hover:bg-gold-bright">{dict.collections.filter.apply}</button>
        {hasFilters && <Link href={`/${lang}/collections/${collectionSlug}`} className="mt-3 block text-center text-xs text-gold-bright">{dict.collections.clearFilters}</Link>}
      </>
    );
  }

  return (
    <>
      <CollectionTracker collectionId={collection.id} />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name,
            description: shortDescription || description,
            url: absoluteUrl(`/${lang}/collections/${collection.slug}`),
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: total,
              itemListElement: products.map((product, index) => ({
                '@type': 'ListItem',
                position: (page - 1) * 12 + index + 1,
                name: localized(lang, product.nameEn, product.nameAr),
                url: absoluteUrl(`/${lang}/product/${product.slug}`),
              })),
            },
          }),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd([
        { name: lang === 'ar' ? 'الرئيسية' : 'Home', path: `/${lang}` },
        { name: dict.collections.title, path: `/${lang}/collections` },
        { name, path: `/${lang}/collections/${collection.slug}` },
      ])) }} />
      {faqItems.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(faqJsonLd(faqItems)),
          }}
        />
      )}

      <section className="relative min-h-[520px] overflow-hidden border-b border-ink-line">
        {collection.coverImage ? (
          <Image src={collection.coverImage} alt={localized(lang, collection.coverAlt ?? name, collection.coverAltAr)} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(200,154,62,0.28),transparent_40%),linear-gradient(145deg,#17140f,#070707)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-ink/20" />
        <div className="relative mx-auto flex min-h-[520px] max-w-6xl items-end px-6 pb-16 pt-32">
          <div className="max-w-3xl">
            <p className="eyebrow mb-4">{total} {dict.collections.scents}</p>
            <h1 className="font-display text-4xl leading-tight text-parchment md:text-6xl">{name}</h1>
            {(shortDescription || description) && <p className="mt-5 max-w-2xl text-sm leading-7 text-parchment/80 md:text-base">{shortDescription || description}</p>}
            <a href="#collection-products" className="mt-8 inline-flex rounded-full bg-gold px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-bright">{dict.collections.explore}</a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <Breadcrumb lang={lang} items={[
          { label: lang === 'ar' ? 'الرئيسية' : 'Home', href: `/${lang}` },
          { label: dict.collections.title, href: `/${lang}/collections` },
          { label: name },
        ]} />
        {description && description !== shortDescription && (
          <section className="mx-auto mb-16 max-w-3xl text-center">
            <p className="eyebrow mb-4">{dict.collections.eyebrow}</p>
            <p className="font-display text-xl leading-9 text-parchment md:text-2xl">{description}</p>
          </section>
        )}

        {featured.length > 0 && (
          <section className="mb-20">
            <p className="eyebrow mb-2">{dict.collections.featured}</p>
            <div className="mt-6 flex snap-x gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
              {featured.map((product) => (
                <CollectionProductCard key={product.id} product={toCardProduct(product)} collectionId={collection.id} lang={lang} dict={dict} featured />
              ))}
            </div>
          </section>
        )}

        <section id="collection-products" className="scroll-mt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">{total} {dict.collections.results}</p>
              <h2 className="font-display text-3xl text-parchment">{dict.collections.allProducts}</h2>
            </div>
            {hasFilters && <Link href={`/${lang}/collections/${collection.slug}`} className="hidden text-xs text-gold-bright md:block">{dict.collections.clearFilters}</Link>}
          </div>

          <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden md:block">
              <div className="sticky top-24 rounded-sm border border-ink-line p-4">
                <p className="mb-4 flex items-center gap-2 text-sm text-parchment"><SlidersHorizontal size={15} />{dict.collections.filters}</p>
                <form><FilterFields /></form>
              </div>
            </aside>

            <div>
              {products.length === 0 ? (
                <div className="rounded-sm border border-ink-line p-10 text-center text-sm text-smoke">{dict.collections.noResults}</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
                  {products.map((product) => (
                    <CollectionProductCard key={product.id} product={toCardProduct(product)} collectionId={collection.id} lang={lang} dict={dict} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-between border-t border-ink-line pt-6 text-xs">
                  {page > 1 ? <Link href={pageHref(page - 1)} className="flex items-center gap-1 text-gold-bright"><ChevronLeft size={15} />{dict.collections.pagination.previous}</Link> : <span />}
                  <span className="text-smoke">{dict.collections.pagination.page} {page} {dict.collections.pagination.of} {totalPages}</span>
                  {page < totalPages ? <Link href={pageHref(page + 1)} className="flex items-center gap-1 text-gold-bright">{dict.collections.pagination.next}<ChevronRight size={15} /></Link> : <span />}
                </nav>
              )}
            </div>
          </div>
        </section>

        {buyingGuide && (
          <section className="mx-auto mt-20 max-w-3xl border-t border-ink-line pt-16">
            <p className="eyebrow mb-3">{dict.collections.buyingGuide}</p>
            <h2 className="font-display text-3xl text-parchment">{name}</h2>
            <p className="mt-6 whitespace-pre-line text-sm leading-8 text-smoke">{buyingGuide}</p>
          </section>
        )}

        {faqItems.length > 0 && (
          <section className="mx-auto mt-20 max-w-3xl border-t border-ink-line pt-16">
            <h2 className="mb-8 font-display text-3xl text-parchment">{dict.collections.faq}</h2>
            {faqItems.map((faq) => (
              <details key={faq.question} className="group border-b border-ink-line py-5">
                <summary className="cursor-pointer list-none font-medium text-parchment">{faq.question}</summary>
                <p className="mt-3 text-sm leading-7 text-smoke">{faq.answer}</p>
              </details>
            ))}
          </section>
        )}

        {collection.relatedFrom.length > 0 && (
          <section className="mt-20 border-t border-ink-line pt-16">
            <h2 className="mb-8 font-display text-3xl text-parchment">{dict.collections.related}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {collection.relatedFrom.map(({ relatedCollection }) => (
                <Link key={relatedCollection.id} href={`/${lang}/collections/${relatedCollection.slug}`} className="group relative min-h-52 overflow-hidden rounded-sm border border-ink-line p-6">
                  {relatedCollection.coverImage && <>
                    <Image src={relatedCollection.coverImage} alt={localized(lang, relatedCollection.coverAlt ?? relatedCollection.name, relatedCollection.coverAltAr)} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
                  </>}
                  <span className="relative flex h-full flex-col justify-end">
                    <span className="eyebrow">{dict.collections.explore}</span>
                    <span className="mt-2 font-display text-2xl text-parchment">{localized(lang, relatedCollection.name, relatedCollection.nameAr)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <details className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-gold/30 bg-ink/95 p-4 shadow-2xl backdrop-blur md:hidden open:max-h-[80vh] open:overflow-y-auto">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-2 text-sm font-medium text-gold-bright"><SlidersHorizontal size={16} />{dict.collections.filters}</summary>
        <form className="mt-5 border-t border-ink-line pt-5"><FilterFields /></form>
      </details>
    </>
  );
}
