import Link from 'next/link';
import { localized } from '@/utils/localized';
import type ar from '@/dictionaries/ar';
import type { Locale } from '@/lib/i18n';

type CategoryCard = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  _count: { perfumes: number };
};

export default function CategoryGrid({
  categories,
  lang,
  dict,
}: {
  categories: CategoryCard[];
  lang: Locale;
  dict: typeof ar;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="content-auto border-t border-ink-line px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow mb-2">{dict.home.categories.eyebrow}</p>
        <h2 className="mb-8 font-display text-2xl text-parchment md:text-3xl">
          {dict.home.categories.title}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${lang}/categories/${cat.slug}`}
              className="hairline flex items-center justify-between rounded-sm p-6 transition-colors hover:border-gold/40"
            >
              <span className="font-display text-lg text-parchment">
                {localized(lang, cat.nameEn, cat.nameAr)}
              </span>
              <span className="eyebrow">{cat._count.perfumes}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
