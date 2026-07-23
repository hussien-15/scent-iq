import { countryFlag } from '@/lib/country-flags';
import type ar from '@/dictionaries/ar';

export default function BrandHero({
  name,
  description,
  originCountry,
  foundedYear,
  perfumeCount,
  dict,
}: {
  name: string;
  description: string;
  originCountry: string | null;
  foundedYear: number | null;
  perfumeCount: number;
  dict: typeof ar;
}) {
  return (
    <section className="relative overflow-hidden bg-vignette px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 font-display text-2xl text-gold-bright">
        {name.charAt(0)}
      </div>
      <h1 className="mt-6 font-display text-4xl text-parchment md:text-5xl">{name}</h1>
      <p className="mt-3 text-sm text-smoke">
        {countryFlag(originCountry)} {originCountry}
        {foundedYear && ` · ${dict.brands.countryInfo.founded} ${foundedYear}`}
        {` · ${perfumeCount} ${dict.brands.scents}`}
      </p>
      <p className="mx-auto mt-6 max-w-xl text-smoke">{description}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="#catalog"
          className="w-full rounded-full bg-gold px-7 py-3 text-center font-body text-sm font-medium text-ink transition-colors hover:bg-gold-bright sm:w-auto"
        >
          {dict.brands.exploreScents}
        </a>
        <a
          href="#about"
          className="eyebrow w-full rounded-full border border-ink-line px-7 py-3 text-center hover:border-gold/50 hover:text-parchment transition-colors sm:w-auto"
        >
          {dict.brands.aboutBrand}
        </a>
      </div>
    </section>
  );
}
