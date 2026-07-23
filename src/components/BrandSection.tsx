import Link from 'next/link';
import { localized } from '@/utils/localized';
import type ar from '@/dictionaries/ar';
import type { Locale } from '@/lib/i18n';

type BrandData = {
  slug: string;
  name: string;
  nameAr: string | null;
  story: string | null;
  storyAr: string | null;
  originCountry: string | null;
  foundedYear: number | null;
  _count: { perfumes: number };
};

export default function BrandSection({
  brand,
  lang,
  dict,
}: {
  brand: BrandData;
  lang: Locale;
  dict: typeof ar;
}) {
  const name = localized(lang, brand.name, brand.nameAr);

  return (
    <section className="border-t border-ink-line py-10">
      <p className="eyebrow mb-4">{dict.product.brandSection.title}</p>
      <div className="hairline flex flex-col gap-6 rounded-sm p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 font-display text-lg text-gold-bright">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="font-display text-xl text-parchment">{name}</h3>
            <p className="mt-1 text-sm text-smoke">
              {localized(lang, brand.story ?? '', brand.storyAr)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-smoke">
              {brand.foundedYear && (
                <span>
                  {dict.product.brandSection.founded} {brand.foundedYear}
                </span>
              )}
              {brand.originCountry && (
                <span>
                  {dict.product.brandSection.country}: {brand.originCountry}
                </span>
              )}
              <span>
                {brand._count.perfumes} {dict.product.brandSection.products}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/${lang}/brands/${brand.slug}`}
          className="eyebrow shrink-0 rounded-full border border-ink-line px-5 py-2.5 text-center hover:border-gold/50 hover:text-parchment transition-colors"
        >
          {dict.product.brandSection.view}
        </Link>
      </div>
    </section>
  );
}
