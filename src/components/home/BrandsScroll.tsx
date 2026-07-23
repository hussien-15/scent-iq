import Link from 'next/link';
import { localized } from '@/utils/localized';
import type ar from '@/dictionaries/ar';
import type { Locale } from '@/lib/i18n';

type BrandCard = {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  originCountry: string | null;
  _count: { perfumes: number };
};

export default function BrandsScroll({
  brands,
  lang,
  dict,
}: {
  brands: BrandCard[];
  lang: Locale;
  dict: typeof ar;
}) {
  return (
    <section className="content-auto border-t border-ink-line px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow mb-2">{dict.home.brandsSection.eyebrow}</p>
        <h2 className="mb-8 font-display text-2xl text-parchment md:text-3xl">
          {dict.home.brandsSection.title}
        </h2>
      </div>

      <div className="scrollbar-subtle mx-auto flex max-w-6xl snap-x gap-4 overflow-x-auto pb-3">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/${lang}/brands/${brand.slug}`}
            className="hairline flex w-64 shrink-0 snap-start flex-col justify-between rounded-sm p-6 transition-colors hover:border-gold/40"
          >
            <div>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 font-display text-lg text-gold-bright">
                {(localized(lang, brand.name, brand.nameAr) || brand.name).charAt(0)}
              </div>
              <h3 className="font-display text-lg text-parchment">
                {localized(lang, brand.name, brand.nameAr)}
              </h3>
              <p className="eyebrow mt-1">{brand.originCountry}</p>
            </div>
            <p className="mt-6 text-xs text-smoke">
              {brand._count.perfumes} {dict.home.brandsSection.products}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
