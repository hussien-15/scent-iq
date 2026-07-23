import { ChevronDown } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Breadcrumb from '@/components/Breadcrumb';
import ProductGallery from '@/components/ProductGallery';
import TagChip from '@/components/TagChip';
import TrustBadges from '@/components/TrustBadges';
import ProductPurchaseActions from '@/components/ProductPurchaseActions';
import StockAlertForm from '@/components/StockAlertForm';
import WishlistButton from '@/components/WishlistButton';
import ShareButtons from '@/components/ShareButtons';
import BrandSection from '@/components/BrandSection';
import ReviewsSection from '@/components/ReviewsSection';
import AuthenticityTrustSection from '@/components/AuthenticityTrustSection';
import ProductSocialProof from '@/components/ProductSocialProof';
import RecentlyViewedRow from '@/components/RecentlyViewedRow';
import RecordRecentlyViewed from '@/components/RecordRecentlyViewed';
import ProductCard from '@/components/ProductCard';
import PerformanceBar from '@/components/PerformanceBar';
import { ProductViewTracker, RecommendationImpressionTracker } from '@/components/AnalyticsTracker';
import { getDictionary, type Locale } from '@/lib/i18n';
import { formatPrice } from '@/utils/format-price';
import { localized } from '@/utils/localized';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd, serializeJsonLd } from '@/utils/seo';
import { tagLabel } from '@/lib/tag-labels';
import { getRelatedPerfumes, getHigherEndAlternatives, getBudgetAlternatives } from '@/services/recommendation.service';
import { getCustomersAlsoViewed } from '@/services/discovery.service';
import type { ProductCardData } from '@/types';

export const revalidate = 900;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string; lang: Locale } }): Promise<Metadata> {
  const perfume = await prisma.perfume.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
    include: { media: { orderBy: { isPrimary: 'desc' }, take: 1 } },
  });
  if (!perfume) return {};

  const title =
    (params.lang === 'ar' ? perfume.metaTitleAr : perfume.metaTitleEn) ??
    localized(params.lang, perfume.nameEn, perfume.nameAr);
  const description =
    (params.lang === 'ar' ? perfume.metaDescriptionAr : perfume.metaDescriptionEn) ??
    localized(params.lang, perfume.descriptionEn, perfume.descriptionAr);

  return buildMetadata({
    title,
    description,
    path: `/product/${perfume.slug}`,
    locale: params.lang,
    image: perfume.ogImage ?? perfume.media[0]?.url ?? undefined,
    keywords: perfume.keywords,
  });
}

export default async function ProductPage({ params }: { params: { slug: string; lang: Locale } }) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;

  const perfume = await prisma.perfume.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
    include: {
      brand: { include: { _count: { select: { perfumes: true } } } },
      category: true,
      notes: { include: { note: true } },
      collections: { include: { collection: true } },
      variants: { orderBy: { bottleSize: 'asc' } },
      media: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
      faqs: { orderBy: { position: 'asc' } },
      reviews: {
        where: { approvalStatus: 'APPROVED' },
        include: {
          user: { select: { name: true } },
          images: { where: { approvalStatus: 'APPROVED' }, select: { id: true, url: true, altText: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!perfume) notFound();

  const price = typeof perfume.price === 'string' ? parseFloat(perfume.price) : Number(perfume.price);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [related, higherEnd, budget, alsoViewed, weeklyReviews, baghdadOrders, winterReviews] = await Promise.all([
    getRelatedPerfumes(perfume.id, lang),
    getHigherEndAlternatives(perfume.id, perfume.scentFamilies, price),
    getBudgetAlternatives(perfume.id, perfume.scentFamilies, price),
    getCustomersAlsoViewed(perfume.id),
    prisma.review.findMany({
      where: { approvalStatus: 'APPROVED', createdAt: { gte: weekAgo } },
      select: { perfumeId: true },
      take: 1000,
    }),
    prisma.orderItem.count({
      where: {
        perfumeId: perfume.id,
        order: { status: 'DELIVERED', city: { contains: 'Baghdad', mode: 'insensitive' } },
      },
    }),
    prisma.review.count({ where: { perfumeId: perfume.id, approvalStatus: 'APPROVED', seasonUsed: 'winter' } }),
  ]);
  const weeklyCounts = weeklyReviews.reduce<Record<string, number>>((counts, review) => {
    counts[review.perfumeId] = (counts[review.perfumeId] ?? 0) + 1;
    return counts;
  }, {});
  const weeklyMaximum = Math.max(0, ...Object.values(weeklyCounts));

  type NoteWithTier = { tier: 'TOP' | 'HEART' | 'BASE'; note: { nameEn: string; nameAr: string; slug: string } };
  const noteNamesByTier = (tier: 'TOP' | 'HEART' | 'BASE') =>
    (perfume.notes as NoteWithTier[])
      .filter((n) => n.tier === tier)
      .map((n) => ({ label: localized(lang, n.note.nameEn, n.note.nameAr), slug: n.note.slug }));

  const tiers: { label: string; notes: { label: string; slug: string }[] }[] = [
    { label: dict.product.top, notes: noteNamesByTier('TOP') },
    { label: dict.product.heart, notes: noteNamesByTier('HEART') },
    { label: dict.product.base, notes: noteNamesByTier('BASE') },
  ];

  const name = localized(lang, perfume.nameEn, perfume.nameAr);
  const description = localized(lang, perfume.descriptionEn, perfume.descriptionAr);
  const story = localized(lang, perfume.storyEn ?? '', perfume.storyAr);
  const brandName = localized(lang, perfume.brand.name, perfume.brand.nameAr);
  const categoryName = perfume.category ? localized(lang, perfume.category.nameEn, perfume.category.nameAr) : null;
  const hasDiscount = perfume.oldPrice != null;

  const performance = [
    { label: dict.product.longevity, value: perfume.longevity, description: dict.product.performanceHelp.longevity },
    { label: dict.product.projection, value: perfume.projection, description: dict.product.performanceHelp.projection },
    { label: dict.product.sillage, value: perfume.sillage, description: dict.product.performanceHelp.sillage },
  ].filter(
    (p): p is { label: string; value: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'; description: string } =>
      p.value != null
  );

  const profileTags = [...perfume.style, ...perfume.mood];
  const basePurchaseOption = {
    sku: perfume.sku,
    bottleSize: perfume.bottleSize,
    price,
    available: Math.max(0, perfume.stock - perfume.reservedStock),
    lowStockThreshold: perfume.lowStockThreshold,
    availability: perfume.availability,
  };
  const purchaseOptions =
    perfume.variants.length > 0
      ? [
          basePurchaseOption,
          ...perfume.variants
            .filter((variant) => variant.availability !== 'HIDDEN')
            .map((variant) => ({
              variantId: variant.id,
              variantName: variant.name,
              sku: variant.sku,
              bottleSize: variant.bottleSize,
              price: Number(variant.price),
              available: Math.max(0, variant.stock - variant.reservedStock),
              lowStockThreshold: variant.lowStockThreshold,
              availability: variant.availability,
            })),
        ]
      : [basePurchaseOption];
  const hasPurchasableStock = purchaseOptions.some(
    (option) => option.available > 0 && !['OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED'].includes(option.availability)
  );
  const canNotifyWhenAvailable = purchaseOptions.some((option) => option.availability !== 'DISCONTINUED');
  const faqItems = perfume.faqs
    .map((faq) => ({
      question: localized(lang, faq.questionEn ?? faq.questionAr, faq.questionAr),
      answer: localized(lang, faq.answerEn ?? faq.answerAr, faq.answerAr),
    }))
    .filter((faq) => faq.question && faq.answer);
  const breadcrumbItems = [
    { name: dict.product.breadcrumbHome, path: `/${lang}` },
    ...(perfume.category && categoryName
      ? [{ name: categoryName, path: `/${lang}/categories/${perfume.category.slug}` }]
      : []),
    { name: brandName, path: `/${lang}/brands/${perfume.brand.slug}` },
    { name, path: `/${lang}/product/${perfume.slug}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 pb-28 md:pb-16">
      <ProductViewTracker perfumeId={perfume.id} brandId={perfume.brandId} />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            description,
            sku: perfume.sku,
            url: absoluteUrl(`/${lang}/product/${perfume.slug}`),
            image: perfume.media.map((media) => media.url),
            category: categoryName ?? undefined,
            brand: { '@type': 'Brand', name: brandName },
            offers: {
              '@type': 'Offer',
              price: perfume.price.toString(),
              priceCurrency: perfume.currency,
              availability: hasPurchasableStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
            additionalProperty: [
              { '@type': 'PropertyValue', name: 'Concentration', value: perfume.concentration },
              { '@type': 'PropertyValue', name: 'Gender', value: perfume.gender },
              { '@type': 'PropertyValue', name: 'Fragrance families', value: perfume.scentFamilies.join(', ') },
            ].filter((property) => property.value),
            aggregateRating:
              perfume.reviews.length > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: (
                      perfume.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
                      perfume.reviews.length
                    ).toFixed(1),
                    reviewCount: perfume.reviews.length,
                  }
                : undefined,
            review: perfume.reviews.slice(0, 10).map((review) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: review.reviewerName || review.user?.name || 'ScentIQ customer' },
              datePublished: review.createdAt.toISOString(),
              reviewBody: review.comment,
              reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5, worstRating: 1 },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd(breadcrumbItems)) }}
      />
      {faqItems.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd(faqItems)) }} />
      )}

      <RecordRecentlyViewed
        item={{
          slug: perfume.slug,
          nameEn: perfume.nameEn,
          nameAr: perfume.nameAr,
          brandName,
          price: perfume.price.toString(),
        }}
      />

      <Breadcrumb
        lang={lang}
        items={[
          { label: dict.product.breadcrumbHome, href: `/${lang}` },
          ...(categoryName ? [{ label: categoryName, href: `/${lang}/categories/${perfume.category!.slug}` }] : []),
          { label: brandName, href: `/${lang}/brands/${perfume.brand.slug}` },
          { label: name },
        ]}
      />

      <div className="grid gap-12 md:grid-cols-2">
        <ProductGallery
          images={perfume.media.map((media) => ({ url: media.url, altText: media.altText }))}
          productName={name}
        />

        <div>
          <Link href={`/${lang}/brands/${perfume.brand.slug}`} className="eyebrow hover:text-parchment">
            {brandName}
          </Link>
          <h1 className="mt-2 font-display text-4xl text-parchment">{name}</h1>
          <p className="mt-4 text-smoke">{description}</p>

          {/* Structured product info */}
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-smoke sm:grid-cols-3">
            {perfume.countryOfOrigin && (
              <div>
                <dt className="text-smoke/60">{dict.product.country}</dt>
                <dd className="text-parchment">{perfume.countryOfOrigin}</dd>
              </div>
            )}
            {perfume.bottleSize && (
              <div>
                <dt className="text-smoke/60">{dict.product.bottleSize}</dt>
                <dd className="text-parchment">{perfume.bottleSize}</dd>
              </div>
            )}
            {perfume.releaseYear && (
              <div>
                <dt className="text-smoke/60">{dict.product.releaseYear}</dt>
                <dd className="text-parchment">{perfume.releaseYear}</dd>
              </div>
            )}
            <div>
              <dt className="text-smoke/60">{dict.product.fragranceFamily}</dt>
              <dd className="text-parchment">
                {perfume.scentFamilies.map((f: string) => tagLabel(f, lang)).join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-smoke/60">{dict.product.sku}</dt>
              <dd className="text-parchment">{perfume.sku}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="flex items-baseline gap-2">
              {hasDiscount && (
                <span className="text-base text-smoke line-through">
                  {formatPrice(perfume.oldPrice!, perfume.currency)}
                </span>
              )}
              <span className="font-display text-2xl text-gold-bright">
                {formatPrice(perfume.price, perfume.currency)}
              </span>
            </span>
            {perfume.discountPercent && (
              <span className="eyebrow rounded-full bg-gold/10 px-3 py-1 text-gold-bright">
                -{perfume.discountPercent}%
              </span>
            )}
            {perfume.concentration && (
              <span className="eyebrow rounded-full border border-ink-line px-3 py-1">{perfume.concentration}</span>
            )}
            {!hasPurchasableStock && (
              <span className="eyebrow rounded-full border border-gold/40 px-3 py-1 text-gold-bright">
                {dict.product.outOfStock}
              </span>
            )}
            {hasPurchasableStock && purchaseOptions.some((option) => option.available <= option.lowStockThreshold) && (
              <span className="eyebrow rounded-full border border-gold/40 px-3 py-1 text-gold-bright">
                {dict.product.lowStock}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-smoke">{dict.product.deliveryEstimate}</p>

          {/* Desktop CTAs — mobile uses the sticky bar below */}
          <div className="mt-6 hidden flex-wrap items-center gap-3 md:flex">
            <ProductPurchaseActions
              product={{
                perfumeId: perfume.id,
                slug: perfume.slug,
                nameEn: perfume.nameEn,
                nameAr: perfume.nameAr,
                brandName,
              }}
              options={purchaseOptions}
              lang={lang}
              dict={dict}
            />
            <WishlistButton
              lang={lang}
              item={{
                perfumeId: perfume.id,
                slug: perfume.slug,
                nameEn: perfume.nameEn,
                nameAr: perfume.nameAr,
                price,
                oldPrice: perfume.oldPrice == null ? null : Number(perfume.oldPrice),
                concentration: perfume.concentration,
                brandNameEn: perfume.brand.name,
                brandNameAr: perfume.brand.nameAr,
              }}
              iconSize={18}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-line text-smoke hover:border-gold/40 hover:text-parchment transition-colors"
            />
          </div>
          {!hasPurchasableStock && canNotifyWhenAvailable && <StockAlertForm perfumeId={perfume.id} dict={dict} />}

          <div className="mt-6 flex items-center gap-3">
            <span className="eyebrow">{dict.product.shareProduct}</span>
            <ShareButtons title={name} dict={dict} />
          </div>

          <div className="mt-8">
            <TrustBadges dict={dict} />
          </div>
          <ProductSocialProof
            loved={weeklyMaximum > 0 && weeklyCounts[perfume.id] === weeklyMaximum}
            baghdad={baghdadOrders > 0}
            wishlisted={perfume.wishlistCount > 0}
            winter={winterReviews > 0}
            dict={dict}
          />

          {/* Performance — displayed visually, per spec */}
          {performance.length > 0 && (
            <div className="mt-8 space-y-3 border-t border-ink-line pt-6">
              <p className="eyebrow mb-1">{dict.product.performance}</p>
              {performance.map((p) => (
                <PerformanceBar key={p.label} label={p.label} value={p.value} description={p.description} />
              ))}
            </div>
          )}

          {/* Notes pyramid — elegant tags, native accordion, zero JS */}
          <div className="mt-8 border-t border-ink-line pt-4">
            <p className="eyebrow mb-2 pt-4">{dict.product.notesPyramid}</p>
            {tiers.map((tier) => (
              <details key={tier.label} className="group border-b border-ink-line py-4" open>
                <summary className="flex cursor-pointer list-none items-center justify-between">
                  <span className="text-xs uppercase tracking-widest2 text-smoke">{tier.label}</span>
                  <ChevronDown size={16} className="text-smoke transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tier.notes.map((note) => (
                    <Link key={note.slug} href={`/${lang}/notes/${note.slug}`}>
                      <TagChip>{note.label}</TagChip>
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>

          {/* Perfume profile tags */}
          {profileTags.length > 0 && (
            <div className="mt-8 border-t border-ink-line pt-6">
              <p className="eyebrow mb-3">{dict.product.profileTitle}</p>
              <div className="flex flex-wrap gap-2">
                {profileTags.map((tag: string) => (
                  <TagChip key={tag}>{tagLabel(tag, lang)}</TagChip>
                ))}
              </div>
            </div>
          )}

          {/* Who is this for */}
          <div className="mt-8 space-y-3 border-t border-ink-line pt-6 text-sm">
            <p className="eyebrow mb-1">{dict.product.forWho.title}</p>
            <div className="flex justify-between">
              <span className="text-smoke">{dict.product.forWho.gender}</span>
              <span className="text-parchment">{tagLabel(perfume.gender, lang)}</span>
            </div>
            {perfume.season.length > 0 && (
              <div className="flex justify-between">
                <span className="text-smoke">{dict.product.forWho.seasons}</span>
                <span className="text-parchment">
                  {perfume.season.map((s: string) => tagLabel(s, lang)).join(', ')}
                </span>
              </div>
            )}
            {perfume.occasion.length > 0 && (
              <div className="flex justify-between">
                <span className="text-smoke">{dict.product.forWho.occasions}</span>
                <span className="text-parchment">
                  {perfume.occasion.map((o: string) => tagLabel(o, lang)).join(', ')}
                </span>
              </div>
            )}
            {perfume.style.length > 0 && (
              <div className="flex justify-between">
                <span className="text-smoke">{dict.product.forWho.style}</span>
                <span className="text-parchment">{perfume.style.map((s: string) => tagLabel(s, lang)).join(', ')}</span>
              </div>
            )}
          </div>

          {/* Related collections */}
          {perfume.collections.length > 0 && (
            <div className="mt-8 border-t border-ink-line pt-6">
              <p className="eyebrow mb-3">{dict.product.relatedCollections}</p>
              <div className="flex flex-wrap gap-2">
                {perfume.collections.map(
                  ({
                    collection,
                  }: {
                    collection: { id: string; slug: string; name: string; nameAr?: string | null };
                  }) => (
                    <Link key={collection.id} href={`/${lang}/collections/${collection.slug}`}>
                      <TagChip>{localized(lang, collection.name, collection.nameAr)}</TagChip>
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Perfume story — emotional, not technical */}
      {story && (
        <section className="mx-auto mt-16 max-w-2xl border-t border-ink-line pt-12 text-center">
          <p className="eyebrow mb-4">{dict.product.storyTitle}</p>
          <p className="font-display text-xl leading-relaxed text-parchment">{story}</p>
        </section>
      )}

      {faqItems.length > 0 && (
        <section className="mx-auto mt-16 max-w-3xl border-t border-ink-line pt-12">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="mb-6 font-display text-2xl text-parchment">
            {lang === 'ar' ? 'أسئلة شائعة عن هذا العطر' : 'Frequently asked questions'}
          </h2>
          <div>
            {faqItems.map((faq) => (
              <details key={faq.question} className="border-b border-ink-line py-4">
                <summary className="cursor-pointer text-sm text-parchment">{faq.question}</summary>
                <p className="mt-3 text-sm leading-7 text-smoke">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <BrandSection brand={perfume.brand} lang={lang} dict={dict} />
      <AuthenticityTrustSection dict={dict} />
      <ReviewsSection
        reviews={perfume.reviews.map((review) => ({ ...review, createdAt: review.createdAt.toISOString() }))}
        perfumeId={perfume.id}
        lang={lang}
        dict={dict}
        defaultReviewerName={undefined}
        isSignedIn={false}
      />

      {related.length > 0 && (
        <section className="mt-16 border-t border-ink-line pt-16">
          <RecommendationImpressionTracker
            perfumeIds={related.map(({ perfume: item }: { perfume: ProductCardData }) => item.id)}
            recommendationType="You May Also Like"
          />
          <p className="eyebrow mb-2">{dict.product.similarEyebrow}</p>
          <h2 className="mb-8 font-display text-3xl text-parchment">{dict.product.youMayAlsoLike}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {related.map(({ perfume: item, reason }: { perfume: ProductCardData; reason: string }) => (
              <div key={item.id}>
                <ProductCard product={item} lang={lang} recommendationType="You May Also Like" />
                <p className="mt-2 text-xs text-smoke">{reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {alsoViewed.length > 0 && (
        <section className="mt-16 border-t border-ink-line pt-16">
          <RecommendationImpressionTracker
            perfumeIds={alsoViewed.map((item: ProductCardData) => item.id)}
            recommendationType="Customers Also Viewed"
          />
          <h2 className="mb-8 font-display text-2xl text-parchment">{dict.product.alsoViewed}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {alsoViewed.map((item: ProductCardData) => (
              <ProductCard key={item.id} product={item} lang={lang} recommendationType="Customers Also Viewed" />
            ))}
          </div>
        </section>
      )}

      {higherEnd.length > 0 && (
        <section className="mt-16 border-t border-ink-line pt-16">
          <RecommendationImpressionTracker
            perfumeIds={higherEnd.map((item: ProductCardData) => item.id)}
            recommendationType="Luxury Alternatives"
          />
          <h2 className="mb-8 font-display text-2xl text-parchment">{dict.product.higherEnd}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {higherEnd.map((item: ProductCardData) => (
              <ProductCard key={item.id} product={item} lang={lang} recommendationType="Luxury Alternatives" />
            ))}
          </div>
        </section>
      )}

      {budget.length > 0 && (
        <section className="mt-16 border-t border-ink-line pt-16">
          <RecommendationImpressionTracker
            perfumeIds={budget.map((item: ProductCardData) => item.id)}
            recommendationType="Budget Alternatives"
          />
          <h2 className="mb-8 font-display text-2xl text-parchment">{dict.product.budgetFriendly}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {budget.map((item: ProductCardData) => (
              <ProductCard key={item.id} product={item} lang={lang} recommendationType="Budget Alternatives" />
            ))}
          </div>
        </section>
      )}

      <div className="mt-16 border-t border-ink-line pt-10">
        <RecentlyViewedRow currentSlug={perfume.slug} lang={lang} dict={dict} />
      </div>

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-ink-line bg-ink/95 px-6 py-4 backdrop-blur md:hidden">
        <WishlistButton
          lang={lang}
          item={{
            perfumeId: perfume.id,
            slug: perfume.slug,
            nameEn: perfume.nameEn,
            nameAr: perfume.nameAr,
            price,
            oldPrice: perfume.oldPrice == null ? null : Number(perfume.oldPrice),
            concentration: perfume.concentration,
            brandNameEn: perfume.brand.name,
            brandNameAr: perfume.brand.nameAr,
          }}
          iconSize={18}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-line text-smoke"
        />
        <ProductPurchaseActions
          product={{
            perfumeId: perfume.id,
            slug: perfume.slug,
            nameEn: perfume.nameEn,
            nameAr: perfume.nameAr,
            brandName,
          }}
          options={purchaseOptions}
          lang={lang}
          dict={dict}
          mobile
        />
      </div>
    </div>
  );
}
