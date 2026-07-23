import Link from 'next/link';
import { tagLabel } from '@/lib/tag-labels';
import type ar from '@/dictionaries/ar';
import type { Locale } from '@/lib/i18n';

const FAMILIES = ['woody', 'fresh', 'oriental', 'floral', 'aquatic', 'oud'];

export default function FamilyGrid({ lang, dict }: { lang: Locale; dict: typeof ar }) {
  return (
    <section className="content-auto border-t border-ink-line px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow mb-2">{dict.home.families.eyebrow}</p>
        <h2 className="mb-8 font-display text-2xl text-parchment md:text-3xl">
          {dict.home.families.title}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {FAMILIES.map((family) => (
            <Link
              key={family}
              href={`/${lang}/shop?family=${family}`}
              className="hairline rounded-sm py-6 text-center transition-colors hover:border-gold/40"
            >
              <span className="font-display text-base text-parchment">
                {tagLabel(family, lang)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
