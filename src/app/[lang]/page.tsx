import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import FadeIn from '@/components/FadeIn';
import SearchBar from '@/components/home/SearchBar';
import FeatureHighlights from '@/components/home/FeatureHighlights';
import BrandsScroll from '@/components/home/BrandsScroll';
import BestSellersRow from '@/components/home/BestSellersRow';
import CategoryGrid from '@/components/home/CategoryGrid';
import FamilyGrid from '@/components/home/FamilyGrid';
import FeaturedCollections from '@/components/home/FeaturedCollections';
import WhyScentIQ from '@/components/home/WhyScentIQ';
import RecommendationsPreview from '@/components/home/RecommendationsPreview';
import ReviewsSlider from '@/components/home/ReviewsSlider';
import Newsletter from '@/components/home/Newsletter';
import { getDictionary, type Locale } from '@/lib/i18n';
import { localized } from '@/utils/localized';
import { getCurrentSeason, getSeasonalPicks } from '@/services/discovery.service';
import { publicCollectionWhere } from '@/services/collection.service';
import type { ProductCardData, BrandSummary } from '@/types';
import { buildMetadata } from '@/utils/seo';
import { PRODUCT_CARD_SELECT } from '@/lib/product-card';
import { buttonStyles } from '@/components/ui/Button';

export const revalidate = 900;

export async function generateMetadata({ params }: { params: { lang: Locale } }): Promise<Metadata> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { startsWith: 'seo.home.' } } });
  const settings = new Map(
    rows.map((row) => [row.key, typeof row.value === 'string' ? row.value : JSON.stringify(row.value)])
  );
  const ar = params.lang === 'ar';
  const title =
    settings.get(ar ? 'seo.home.titleAr' : 'seo.home.titleEn') ??
    (ar ? 'عطور مختارة بعناية في العراق' : 'Carefully selected perfumes in Iraq');
  const description =
    settings.get(ar ? 'seo.home.descriptionAr' : 'seo.home.descriptionEn') ??
    (ar
      ? 'اكتشف عطورًا مختارة بعناية مع تفاصيل النوتات والأداء والمراجعات وخيارات الطلب داخل العراق.'
      : 'Discover carefully selected perfumes with notes, performance details, reviews, and ordering options across Iraq.');
  const keywords = (settings.get('seo.home.keywords') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return buildMetadata({
    title,
    description,
    path: '',
    locale: params.lang,
    image: settings.get('seo.home.ogImage') || undefined,
    keywords,
  });
}

export default async function HomePage({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;

  const currentSeason = getCurrentSeason();

  const [featured, brands, bestSellerTags, categories, reviews, seasonalPicks, featuredCollections] = await Promise.all(
    [
      prisma.perfume.findMany({
        where: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: PRODUCT_CARD_SELECT,
      }),
      prisma.brand.findMany({
        take: 6,
        select: {
          id: true,
          slug: true,
          name: true,
          nameAr: true,
          originCountry: true,
          story: true,
          storyAr: true,
          _count: { select: { perfumes: true } },
        },
      }),
      prisma.productTag.findMany({
        where: { tag: { slug: 'bestseller' }, perfume: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } } },
        select: {
          perfume: {
            select: {
              ...PRODUCT_CARD_SELECT,
              reviews: { where: { approvalStatus: 'APPROVED' }, select: { rating: true } },
            },
          },
        },
      }),
      prisma.category.findMany({
        select: { id: true, slug: true, nameEn: true, nameAr: true, _count: { select: { perfumes: true } } },
      }),
      prisma.review.findMany({
        where: { approvalStatus: 'APPROVED' },
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          reviewerName: true,
          verifiedPurchase: true,
          user: { select: { name: true } },
          perfume: { select: { nameEn: true, nameAr: true } },
        },
      }),
      getSeasonalPicks(currentSeason),
      prisma.collection.findMany({
        where: { featuredOnHomepage: true, ...publicCollectionWhere() },
        orderBy: { homepageOrder: 'asc' },
        take: 4,
        select: {
          id: true,
          slug: true,
          name: true,
          nameAr: true,
          shortDescription: true,
          shortDescriptionAr: true,
          coverImage: true,
          coverAlt: true,
          coverAltAr: true,
        },
      }),
    ]
  );

  type BestSellerRow = {
    perfume: ProductCardData & { reviews: { rating: number }[] };
  };
  const bestSellers = (bestSellerTags as BestSellerRow[]).map(({ perfume }) => {
    const ratings = perfume.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return { ...perfume, avgRating };
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-vignette px-4 py-16 text-center sm:px-6 md:py-24">
        <FadeIn>
          <p className="eyebrow mb-6">{dict.hero.eyebrow}</p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl leading-tight text-parchment md:text-6xl">
            {dict.hero.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-smoke">{dict.hero.subtext}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={`/${lang}/shop`} className={buttonStyles({ size: 'lg', className: 'w-full sm:w-auto' })}>
              {dict.hero.ctaShop}
            </Link>
            <Link
              href={`/${lang}/brands`}
              className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              {dict.hero.ctaBrands}
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Smart search — immediately after hero, per spec */}
      <section className="border-t border-ink-line px-4 py-8 sm:px-6 sm:py-10">
        <SearchBar
          lang={lang}
          placeholder={dict.search.placeholder}
          noResultsLabel={dict.search.noResults}
          loadingLabel={dict.search.loading}
          viewAllResultsLabel={dict.search.viewAllResults}
        />
      </section>

      <FeatureHighlights dict={dict} />

      {/* Featured perfumes */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-end justify-between md:mb-10">
          <div>
            <p className="eyebrow mb-2">{dict.home.recentlyAdded}</p>
            <h2 className="font-display text-2xl text-parchment md:text-3xl">{dict.home.featuredPerfumes}</h2>
          </div>
          <Link href={`/${lang}/shop`} className="eyebrow hover:text-parchment transition-colors">
            {dict.home.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {featured.map((perfume: ProductCardData) => (
            <ProductCard key={perfume.id} product={perfume} lang={lang} />
          ))}
        </div>
      </section>

      <BrandsScroll brands={brands} lang={lang} dict={dict} />
      <BestSellersRow perfumes={bestSellers} lang={lang} dict={dict} />
      <CategoryGrid categories={categories} lang={lang} dict={dict} />
      <FamilyGrid lang={lang} dict={dict} />
      <FeaturedCollections collections={featuredCollections} lang={lang} dict={dict} />

      {seasonalPicks.length > 0 && (
        <section className="content-auto mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="eyebrow mb-2">{dict.home.seasonal.eyebrow}</p>
          <h2 className="mb-8 font-display text-2xl text-parchment md:text-3xl">{dict.home.seasonal.title}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {seasonalPicks.map((perfume: ProductCardData) => (
              <ProductCard key={perfume.id} product={perfume} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* Brand spotlight (kept from the earlier pass — story-driven, distinct from the BrandsScroll cards above) */}
      <section className="content-auto border-t border-ink-line px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow mb-2 text-center">{dict.home.spotlightEyebrow}</p>
          <h2 className="mb-10 text-center font-display text-2xl text-parchment md:mb-12 md:text-3xl">
            {dict.home.spotlightTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {brands.slice(0, 3).map((brand: BrandSummary) => (
              <Link
                key={brand.id}
                href={`/${lang}/brands/${brand.slug}`}
                className="hairline block rounded-sm p-6 transition-colors hover:border-gold/40"
              >
                <h3 className="font-display text-xl text-parchment">{localized(lang, brand.name, brand.nameAr)}</h3>
                <p className="mt-1 eyebrow">{brand.originCountry}</p>
                <p className="mt-4 text-sm text-smoke">{localized(lang, brand.story ?? '', brand.storyAr)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WhyScentIQ dict={dict} />
      <RecommendationsPreview dict={dict} />
      <ReviewsSlider reviews={reviews} lang={lang} dict={dict} />
      <Newsletter dict={dict} />
    </>
  );
}
