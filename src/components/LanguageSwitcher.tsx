'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

export default function LanguageSwitcher({
  lang,
  label,
}: {
  lang: Locale;
  label: string;
}) {
  const pathname = usePathname() ?? `/${lang}`;
  const otherLocale: Locale = lang === 'ar' ? 'en' : 'ar';
  const rest = pathname.replace(/^\/(ar|en)/, '');
  const href = `/${otherLocale}${rest || ''}`;

  return (
    <Link href={href} className="eyebrow flex h-11 min-w-11 items-center justify-center hover:text-parchment transition-colors">
      {label}
    </Link>
  );
}
