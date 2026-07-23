import Link from 'next/link';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import { SearchX } from 'lucide-react';
import Pagination from '@/components/Pagination';
import SearchBar from '@/components/home/SearchBar';
import { getDictionary, type Locale } from '@/lib/i18n';
import { tagLabel } from '@/lib/tag-labels';
import { searchScore } from '@/utils/search-match';
import type { ProductCardData } from '@/types';
import { buildMetadata } from '@/utils/seo';
import { CARD_MAIN_MEDIA_SELECT, CARD_MEDIA_SELECT } from '@/lib/product-card';
import ShopFilterDrawer from '@/components/shop/ShopFilterDrawer';

export const dynamic = 'force-dynamic';

const FAMILIES = ['oriental', 'fresh', 'woody', 'floral', 'aquatic', 'oud'];
const GENDERS = ['MASCULINE', 'FEMININE', 'UNISEX'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const PAGE_SIZE = 16;
type ShopSearchParams = {
  family?: string;
  category?: string;
  gender?: string;
  season?: string;
  q?: string;
  page?: string;
};

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { lang: Locale };
  searchParams: ShopSearchParams;
}): Promise<Metadata> {
  const ar = params.lang === 'ar';
  const filtered = Object.values(searchParams).some(Boolean);
  return buildMetadata({
    title: ar ? 'تسوّق العطور المختارة في العراق' : 'Shop selected perfumes in Iraq',
    description: ar
      ? 'ابحث وقارن العطور حسب العائلة والموسم والجنس، مع معلومات الأداء والمراجعات قبل الطلب داخل العراق.'
      : 'Search and compare perfumes by family, season and gender, with performance details and reviews before ordering in Iraq.',
    path: '/shop',
    locale: params.lang,
    noIndex: filtered,
    keywords: ar
      ? ['شراء عطور في العراق', 'متجر عطور أونلاين', 'عطور بغداد']
      : ['buy perfumes Iraq', 'online perfume store Iraq'],
  });
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: { lang: Locale };
  searchParams: ShopSearchParams;
}) {
  const dict = getDictionary(params.lang);
  const {
    family: activeFamily,
    category: activeCategory,
    gender: activeGender,
    season: activeSeason,
    q,
  } = searchParams;
  const hasFilters = Boolean(activeFamily || activeCategory || activeGender || activeSeason);

  const validGender = GENDERS.includes(activeGender ?? '') ? activeGender : undefined;

  const where: Prisma.PerfumeWhereInput = {
    status: 'PUBLISHED',
    availability: { not: 'HIDDEN' },
    ...(activeFamily ? { scentFamilies: { has: activeFamily } } : {}),
    ...(activeCategory ? { category: { slug: activeCategory } } : {}),
    ...(validGender ? { gender: validGender as 'MASCULINE' | 'FEMININE' | 'UNISEX' } : {}),
    ...(activeSeason ? { season: { has: activeSeason } } : {}),
  };
  const requestedPage = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1);
  const cardSelect = {
    id: true,
    slug: true,
    nameEn: true,
    nameAr: true,
    price: true,
    oldPrice: true,
    concentration: true,
    scentFamilies: true,
    searchAliases: true,
    keywords: true,
    availability: true,
    availableStock: true,
    lowStockThreshold: true,
    _count: { select: { variants: true } },
    brand: { select: { name: true, nameAr: true, searchAliases: true } },
    mainImage: CARD_MAIN_MEDIA_SELECT,
    media: CARD_MEDIA_SELECT,
    notes: { select: { note: { select: { nameEn: true, nameAr: true } } } },
  } satisfies Prisma.PerfumeSelect;

  let perfumes: ProductCardData[];
  let total: number;
  let rankedSearch: ProductCardData[] | null = null;
  if (q?.trim()) {
    const candidates = await prisma.perfume.findMany({
      where,
      orderBy: [{ popularityScore: 'desc' }, { nameEn: 'asc' }],
      take: 250,
      select: cardSelect,
    });
    const ranked = candidates
      .map((perfume) => ({ perfume, score: searchScore(perfume, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ perfume }) => perfume);
    rankedSearch = ranked;
    total = ranked.length;
    perfumes = [];
  } else {
    total = await prisma.perfume.count({ where });
    perfumes = await prisma.perfume.findMany({
      where,
      orderBy: { nameEn: 'asc' },
      skip: (requestedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: cardSelect,
    });
  }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  if (rankedSearch) {
    perfumes = rankedSearch.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else if (page !== requestedPage && total > 0) {
    perfumes = await prisma.perfume.findMany({
      where,
      orderBy: { nameEn: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: cardSelect,
    });
  }

  function buildFilterHref(param: string, value?: string) {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (activeFamily) query.set('family', activeFamily);
    if (activeCategory) query.set('category', activeCategory);
    if (validGender) query.set('gender', validGender);
    if (activeSeason) query.set('season', activeSeason);

    if (value) query.set(param, value);
    else query.delete(param);

    const serialized = query.toString();
    return `/${params.lang}/shop${serialized ? `?${serialized}` : ''}`;
  }

  function buildAllHref() {
    return q ? `/${params.lang}/shop?q=${encodeURIComponent(q)}` : `/${params.lang}/shop`;
  }

  function filterLink(param: string, value: string, active: boolean) {
    return (
      <Link
        key={value}
        href={buildFilterHref(param, active ? undefined : value)}
        aria-pressed={active}
        className={`eyebrow rounded-full border px-4 py-2 transition-colors ${
          active ? 'border-gold text-gold-bright' : 'border-ink-line hover:border-gold/40'
        }`}
      >
        {tagLabel(value, params.lang)}
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <p className="eyebrow mb-2">{q ? `${dict.shop.searchResultsFor} "${q}"` : dict.shop.eyebrow}</p>
        <h1 className="font-display text-4xl text-parchment">{dict.shop.title}</h1>
      </div>

      <div className="mb-10">
        <SearchBar
          lang={params.lang}
          placeholder={dict.search.placeholder}
          noResultsLabel={dict.search.noResults}
          loadingLabel={dict.search.loading}
          viewAllResultsLabel={dict.search.viewAllResults}
        />
      </div>

      <ShopFilterDrawer lang={params.lang} />
      <div className="mb-6 hidden flex-wrap items-center gap-2 md:flex">
        <Link
          href={buildAllHref()}
          className={`eyebrow rounded-full border px-4 py-2 transition-colors ${
            !hasFilters ? 'border-gold text-gold-bright' : 'border-ink-line hover:border-gold/40'
          }`}
        >
          {dict.shop.all}
        </Link>
        {FAMILIES.map((f) => filterLink('family', f, activeFamily === f))}
      </div>

      <div className="mb-3 hidden flex-wrap items-center gap-2 md:flex">
        <span className="text-xs text-smoke/60">{dict.shop.filterGender}:</span>
        {GENDERS.map((g) => filterLink('gender', g, activeGender === g))}
      </div>

      <div className="mb-6 hidden flex-wrap items-center gap-2 md:flex">
        <span className="text-xs text-smoke/60">{dict.shop.filterSeason}:</span>
        {SEASONS.map((s) => filterLink('season', s, activeSeason === s))}
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink-line pt-5 text-xs text-smoke">
        <span>
          {total} {dict.shop.resultsCount}
        </span>
        {(hasFilters || q) && (
          <Link href={`/${params.lang}/shop`} className="text-gold-bright hover:text-gold transition-colors">
            {dict.shop.clearFilters}
          </Link>
        )}
      </div>

      {perfumes.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={q ? dict.ui.empty.searchTitle : dict.ui.empty.shopTitle}
          description={q ? dict.ui.empty.searchDescription : dict.ui.empty.shopDescription}
          action={{ label: dict.ui.empty.shopAction, href: `/${params.lang}/shop` }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {perfumes.map((perfume: ProductCardData) => (
            <ProductCard key={perfume.id} product={perfume} lang={params.lang} />
          ))}
        </div>
      )}
      <Pagination
        path={`/${params.lang}/shop`}
        searchParams={searchParams}
        page={page}
        totalPages={totalPages}
        previousLabel={params.lang === 'ar' ? 'السابق' : 'Previous'}
        nextLabel={params.lang === 'ar' ? 'التالي' : 'Next'}
      />
    </div>
  );
}
