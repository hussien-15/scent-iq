import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import { localized } from '@/utils/localized';
import type { Locale } from '@/lib/i18n';
import type ar from '@/dictionaries/ar';

type FeaturedCollection = {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  shortDescription: string | null;
  shortDescriptionAr: string | null;
  coverImage: string | null;
  coverAlt: string | null;
  coverAltAr: string | null;
};

export default function FeaturedCollections({
  collections,
  lang,
  dict,
}: {
  collections: FeaturedCollection[];
  lang: Locale;
  dict: typeof ar;
}) {
  if (collections.length === 0) return null;
  const Arrow = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  return (
    <section className="content-auto border-t border-ink-line px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">{dict.collections.eyebrow}</p>
            <h2 className="font-display text-2xl text-parchment md:text-3xl">{dict.collections.title}</h2>
          </div>
          <Link href={`/${lang}/collections`} className="eyebrow hover:text-parchment">{dict.home.viewAll}</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {collections.map((collection) => {
            const name = localized(lang, collection.name, collection.nameAr);
            const description = localized(lang, collection.shortDescription ?? '', collection.shortDescriptionAr);
            return (
              <Link key={collection.id} href={`/${lang}/collections/${collection.slug}`} className="group relative min-h-72 overflow-hidden rounded-sm border border-ink-line">
                {collection.coverImage ? (
                  <Image src={collection.coverImage} alt={localized(lang, collection.coverAlt ?? name, collection.coverAltAr)} fill sizes="(min-width: 768px) 50vw, 100vw" quality={75} className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" />
                ) : <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,154,62,0.22),transparent_45%),linear-gradient(135deg,#171511,#080808)]" />}
                <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-6">
                  <span className="font-display text-2xl text-parchment">{name}</span>
                  {description && <span className="mt-2 line-clamp-2 block text-sm leading-6 text-smoke">{description}</span>}
                  <span className="mt-4 flex items-center gap-2 text-xs text-gold-bright">{dict.collections.explore}<Arrow size={14} /></span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
