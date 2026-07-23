import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export default function Breadcrumb({
  lang,
  items,
}: {
  lang: Locale;
  items: { label: string; href?: string }[];
}) {
  const Separator = lang === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-smoke" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <Separator size={12} aria-hidden="true" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-parchment transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-parchment">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
