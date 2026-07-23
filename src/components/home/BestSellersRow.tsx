import BestSellerCard, { type BestSellerData } from './BestSellerCard';
import type ar from '@/dictionaries/ar';
import type { Locale } from '@/lib/i18n';

export default function BestSellersRow({
  perfumes,
  lang,
  dict,
}: {
  perfumes: BestSellerData[];
  lang: Locale;
  dict: typeof ar;
}) {
  if (perfumes.length === 0) return null;

  return (
    <section className="content-auto border-t border-ink-line px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow mb-2">{dict.home.bestSellers.eyebrow}</p>
        <h2 className="mb-8 font-display text-2xl text-parchment md:text-3xl">
          {dict.home.bestSellers.title}
        </h2>
      </div>
      <div className="scrollbar-subtle mx-auto flex max-w-6xl snap-x gap-5 overflow-x-auto pb-3">
        {perfumes.map((p) => (
          <BestSellerCard key={p.id} product={p} lang={lang} />
        ))}
      </div>
    </section>
  );
}
