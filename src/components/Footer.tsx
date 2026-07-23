import Link from 'next/link';
import NotesPyramid from './NotesPyramid';
import type ar from '@/dictionaries/ar';
import type { Locale } from '@/lib/i18n';

export default function Footer({ lang, dict }: { lang: Locale; dict: typeof ar }) {
  return (
    <footer className="border-t border-ink-line px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
        <div className="flex flex-col items-start gap-4 md:col-span-1">
          <p className="font-display text-xl text-parchment">{dict.footer.tagline}</p>
          <p className="eyebrow max-w-xs text-smoke">{dict.footer.description}</p>
        </div>

        <div>
          <p className="eyebrow mb-4">{dict.footer.shopHeading}</p>
          <ul className="space-y-2 text-sm text-smoke">
            <li><Link href={`/${lang}/shop`} className="hover:text-parchment transition-colors">{dict.nav.shop}</Link></li>
            <li><Link href={`/${lang}/brands`} className="hover:text-parchment transition-colors">{dict.nav.brands}</Link></li>
            <li><Link href={`/${lang}/collections`} className="hover:text-parchment transition-colors">{dict.nav.collections}</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">{dict.footer.companyHeading}</p>
          <ul className="space-y-2 text-sm text-smoke">
            <li><Link href={`/${lang}/about`} className="hover:text-parchment transition-colors">{dict.footer.about}</Link></li>
            <li><Link href={`/${lang}/contact`} className="hover:text-parchment transition-colors">{dict.footer.contact}</Link></li>
            <li><Link href={`/${lang}/shipping`} className="hover:text-parchment transition-colors">{dict.footer.shipping}</Link></li>
            <li><Link href={`/${lang}/privacy`} className="hover:text-parchment transition-colors">{dict.footer.privacy}</Link></li>
            <li><Link href={`/${lang}/terms`} className="hover:text-parchment transition-colors">{dict.footer.terms}</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center gap-4 border-t border-ink-line pt-10 text-center">
        <NotesPyramid />
        <p className="text-xs text-smoke/70">
          © {new Date().getFullYear()} ScentIQ. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
