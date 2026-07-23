import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import HeaderSearchToggle from './HeaderSearchToggle';
import CartCountBadge from './CartCountBadge';
import WishlistCountBadge from './WishlistCountBadge';
import type { Locale } from '@/lib/i18n';
import type ar from '@/dictionaries/ar';

export default function Header({ lang, dict }: { lang: Locale; dict: typeof ar }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-4 py-2 sm:gap-3 sm:px-6 sm:py-3">
        <Link href={`/${lang}`} className="shrink-0 font-display text-xl tracking-wide text-parchment sm:text-2xl">
          Scent<span className="text-gold">IQ</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href={`/${lang}/shop`} className="eyebrow hover:text-parchment transition-colors">
            {dict.nav.shop}
          </Link>
          <Link href={`/${lang}/brands`} className="eyebrow hover:text-parchment transition-colors">
            {dict.nav.brands}
          </Link>
          <Link
            href={`/${lang}/collections`}
            className="eyebrow hover:text-parchment transition-colors"
          >
            {dict.nav.collections}
          </Link>
        </nav>

        <div className="flex items-center gap-0 sm:gap-1">
          <HeaderSearchToggle lang={lang} placeholder={dict.search.placeholder} />
          <Link
            href={`/${lang}/wishlist`}
            aria-label={dict.nav.wishlist}
            className="relative flex h-11 w-11 items-center justify-center text-smoke hover:text-parchment transition-colors"
          >
            <Heart size={18} />
            <WishlistCountBadge />
          </Link>
          <Link
            href={`/${lang}/cart`}
            aria-label={dict.nav.cart}
            className="relative flex h-11 w-11 items-center justify-center text-smoke hover:text-parchment transition-colors"
          >
            <ShoppingBag size={18} />
            <CartCountBadge />
          </Link>
          <LanguageSwitcher lang={lang} label={dict.lang.switchTo} />
          <Link
            href={`/${lang}/login`}
            className="eyebrow hidden rounded-full border border-ink-line px-4 py-2 hover:border-gold/50 hover:text-parchment transition-colors sm:block"
          >
            {dict.nav.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
