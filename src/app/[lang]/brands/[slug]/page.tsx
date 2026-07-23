import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import BrandHero from '@/components/BrandHero';
import Breadcrumb from '@/components/Breadcrumb';
import ProductCard from '@/components/ProductCard';
import TagChip from '@/components/TagChip';
import { getDictionary, resolveLocale } from '@/lib/i18n';
import { localized } from '@/utils/localized';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd, serializeJsonLd } from '@/utils/seo';
import { countryFlag } from '@/lib/country-flags';
import { tagLabel } from '@/lib/tag-labels';
import type { ProductCardData, BrandSummary } from '@/types';

export const revalidate = 900;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string; lang: string }>;
  }
): Promise<Metadata> {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const brand = await prisma.brand.findUnique({ where: { slug: params.slug } });
  if (!brand) return {};

  const name = localized(params.lang, brand.metaTitleEn ?? brand.name, brand.metaTitleAr ?? brand.nameAr);
  return buildMetadata({
    title: name,
    description: localized(params.lang, brand.metaDescriptionEn ?? brand.descriptionEn ?? brand.story ?? name, brand.metaDescriptionAr ?? brand.descriptionAr ?? brand.storyAr),
    path: `/brands/${brand.slug}`,
    locale: params.lang,
    image: brand.ogImage ?? brand.bannerUrl ?? brand.logoUrl ?? undefined,
    keywords: brand.keywords,
  });
}

export default async function BrandPage(
  props: {
    params: Promise<{ slug: string; lang: string }>;
  }
) {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const dict = getDictionary(params.lang);
  const lang = params.lang;

  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug },
    include: {
      perfumes: {
        where: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
        include: {
          reviews: { where: { approvalStatus: 'APPROVED' }, select: { rating: true } },
          tags: { include: { tag: true } },
        },
      },
      faqs: { orderBy: { position: 'asc' } },
    },
  });

  if (!brand) notFound();

  const otherBrands = await prisma.brand.findMany({
    where: { id: { not: brand.id } },
    include: { _count: { select: { perfumes: true } } },
  });

  const name = localized(lang, brand.name, brand.nameAr);
  const description =
    localized(lang, brand.descriptionEn ?? '', brand.descriptionAr) ||
    (brand.story ? localized(lang, brand.story, brand.storyAr) : '');

  type PerfumeWithExtras = ProductCardData & {
    createdAt: Date;
    viewCount: number;
    season: string[];
    reviews: { rating: number }[];
    tags: { tag: { slug: string } }[];
  };
  const perfumes = brand.perfumes as unknown as PerfumeWithExtras[];

  const bestSeller = perfumes.find((p) => p.tags.some((t) => t.tag.slug === 'bestseller'));
  const editorsPicks = perfumes.filter((p) => p.tags.some((t) => t.tag.slug === 'editors-pick'));
  const newArrivals = [...perfumes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const mostViewed = [...perfumes].sort((a, b) => b.viewCount - a.viewCount)[0];

  const allBrandReviews = perfumes.flatMap((p) => p.reviews);
  const brandAvgRating = allBrandReviews.length
    ? allBrandReviews.reduce((s, r) => s + r.rating, 0) / allBrandReviews.length
    : null;

  const summerPick = perfumes.find((p) => p.season?.includes('summer'));
  const winterPick = perfumes.find((p) => p.season?.includes('winter'));
  const fallbackFaqs = [
    { question: dict.brands.faq.isOriginal, answer: dict.brands.faq.isOriginalAnswer },
    { question: dict.brands.faq.bestSellerQ, answer: bestSeller ? localized(lang, bestSeller.nameEn, bestSeller.nameAr) : dict.brands.faq.noneFound },
    { question: dict.brands.faq.longLastingQ, answer: dict.brands.faq.longLastingAnswer },
    { question: dict.brands.faq.summerQ, answer: summerPick ? localized(lang, summerPick.nameEn, summerPick.nameAr) : dict.brands.faq.noneFound },
    { question: dict.brands.faq.winterQ, answer: winterPick ? localized(lang, winterPick.nameEn, winterPick.nameAr) : dict.brands.faq.noneFound },
  ];
  const faqItems = brand.faqs.length
    ? brand.faqs.map((faq) => ({ question: localized(lang, faq.questionEn ?? faq.questionAr, faq.questionAr), answer: localized(lang, faq.answerEn ?? faq.answerAr, faq.answerAr) }))
    : fallbackFaqs;
  const brandJsonLd = {
    '@context': 'https://schema.org', '@type': 'Brand', name,
    description, url: absoluteUrl(`/${lang}/brands/${brand.slug}`),
    logo: brand.logoUrl ?? undefined,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(brandJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd([
        { name: lang === 'ar' ? 'الرئيسية' : 'Home', path: `/${lang}` },
        { name: dict.brands.title, path: `/${lang}/brands` },
        { name, path: `/${lang}/brands/${brand.slug}` },
      ])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd(faqItems)) }} />
      <BrandHero
        name={name}
        description={description}
        originCountry={brand.originCountry}
        foundedYear={brand.foundedYear}
        perfumeCount={perfumes.length}
        dict={dict}
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <Breadcrumb lang={lang} items={[
          { label: lang === 'ar' ? 'الرئيسية' : 'Home', href: `/${lang}` },
          { label: dict.brands.title, href: `/${lang}/brands` },
          { label: name },
        ]} />
        {/* Characteristics */}
        {brand.characteristics.length > 0 && (
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            {brand.characteristics.map((c: string) => (
              <TagChip key={c}>{tagLabel(c, lang)}</TagChip>
            ))}
          </div>
        )}

        {/* Story + country info */}
        <div id="about" className="grid gap-10 border-t border-ink-line pt-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="eyebrow mb-3">{dict.brands.story}</p>
            <p className="text-sm leading-7 text-smoke">
              {localized(lang, brand.story ?? '', brand.storyAr)}
            </p>
            {brand.signatureStyleEn && (
              <p className="mt-4 border-s-2 border-gold/50 ps-4 text-sm italic text-parchment">
                {localized(lang, brand.signatureStyleEn, brand.signatureStyleAr)}
              </p>
            )}
          </div>
          <div className="space-y-3 text-sm">
            {brand.originCountry && (
              <div className="flex justify-between border-b border-ink-line pb-2">
                <span className="text-smoke">{dict.brands.countryInfo.headquarters}</span>
                <span className="text-parchment">
                  {countryFlag(brand.originCountry)} {brand.headquarters ?? brand.originCountry}
                </span>
              </div>
            )}
            {brand.foundedYear && (
              <div className="flex justify-between border-b border-ink-line pb-2">
                <span className="text-smoke">{dict.brands.countryInfo.founded}</span>
                <span className="text-parchment">{brand.foundedYear}</span>
              </div>
            )}
            {brand.industry && (
              <div className="flex justify-between border-b border-ink-line pb-2">
                <span className="text-smoke">{dict.brands.countryInfo.industry}</span>
                <span className="text-parchment">{brand.industry}</span>
              </div>
            )}
          </div>
        </div>

        {/* Brand stats */}
        <div className="mt-14 grid grid-cols-2 gap-6 border-t border-ink-line pt-12 sm:grid-cols-4">
          <div className="text-center">
            <p className="font-display text-2xl text-gold-bright">{perfumes.length}</p>
            <p className="mt-1 text-xs text-smoke">{dict.brands.stats.availablePerfumes}</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-gold-bright">
              {brandAvgRating ? brandAvgRating.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-xs text-smoke">{dict.brands.stats.averageRating}</p>
          </div>
          <div className="text-center">
            <p className="truncate font-display text-sm text-parchment">
              {bestSeller ? localized(lang, bestSeller.nameEn, bestSeller.nameAr) : '—'}
            </p>
            <p className="mt-1 text-xs text-smoke">{dict.brands.stats.bestSeller}</p>
          </div>
          <div className="text-center">
            <p className="truncate font-display text-sm text-parchment">
              {mostViewed && mostViewed.viewCount > 0
                ? localized(lang, mostViewed.nameEn, mostViewed.nameAr)
                : '—'}
            </p>
            <p className="mt-1 text-xs text-smoke">{dict.brands.stats.mostViewed}</p>
          </div>
        </div>

        {/* Editor's picks */}
        {editorsPicks.length > 0 && (
          <div className="mt-14 border-t border-ink-line pt-12">
            <p className="eyebrow mb-1">{dict.brands.editorsPicks.title}</p>
            <p className="mb-6 max-w-lg text-sm text-smoke">{dict.brands.editorsPicks.why}</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {editorsPicks.map((p) => (
                <ProductCard key={p.id} product={p} lang={lang} />
              ))}
            </div>
          </div>
        )}

        {/* Full catalog */}
        <div id="catalog" className="mt-14 border-t border-ink-line pt-12">
          <h2 className="mb-8 font-display text-2xl text-parchment md:text-3xl">
            {dict.brands.catalog}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {perfumes.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        </div>

        {/* New arrivals */}
        {newArrivals.length > 0 && (
          <div className="mt-14 border-t border-ink-line pt-12">
            <h2 className="mb-8 font-display text-2xl text-parchment">{dict.brands.newArrivals}</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {newArrivals.slice(0, 4).map((p) => (
                <div key={p.id} className="w-48 shrink-0">
                  <ProductCard product={p} lang={lang} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-14 border-t border-ink-line pt-12">
          <h2 className="mb-6 font-display text-2xl text-parchment">{dict.brands.faq.title}</h2>
          <div className="space-y-1">
            {faqItems.map((item) => (
              <details key={item.question} className="border-b border-ink-line py-4">
                <summary className="cursor-pointer text-sm text-parchment">{item.question}</summary>
                <p className="mt-2 text-sm text-smoke">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Related brands */}
        {otherBrands.length > 0 && (
          <div className="mt-14 border-t border-ink-line pt-12">
            <h2 className="mb-8 font-display text-2xl text-parchment">{dict.brands.relatedBrands}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {otherBrands.map((b: BrandSummary) => (
                <Link
                  key={b.id}
                  href={`/${lang}/brands/${b.slug}`}
                  className="hairline flex items-center justify-between rounded-sm p-6 transition-colors hover:border-gold/40"
                >
                  <span className="font-display text-lg text-parchment">
                    {localized(lang, b.name, b.nameAr)}
                  </span>
                  <span className="eyebrow">{b._count?.perfumes ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
