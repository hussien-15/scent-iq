'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowUpLeft, ArrowUpRight, Home, Search } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';

export default function LocalizedNotFound() {
  const params = useParams<{ lang?: string }>();
  const lang = params?.lang === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const links = [
    {
      href: `/${lang}/shop`,
      title: ar ? 'العطور الأكثر طلبًا' : 'Popular perfumes',
      text: ar ? 'تصفّح العطور المتوفرة وقارن تفاصيلها.' : 'Browse available perfumes and compare their details.',
    },
    {
      href: `/${lang}/brands`,
      title: ar ? 'ماركات العطور' : 'Perfume brands',
      text: ar ? 'اكتشف بيوت العطور وقصصها.' : 'Discover perfume houses and their stories.',
    },
    {
      href: `/${lang}/collections`,
      title: ar ? 'المجموعات المختارة' : 'Curated collections',
      text: ar ? 'اختيارات حسب الموسم والمناسبة.' : 'Selections by season and occasion.',
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="font-display text-4xl text-parchment md:text-6xl">
          {ar ? 'هذه الصفحة غير موجودة' : 'This page could not be found'}
        </h1>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-smoke">
          {ar
            ? 'ربما تغيّر الرابط أو حُذفت الصفحة. ابحث عن عطرك أو ابدأ من أحد الأقسام أدناه.'
            : 'The link may have changed or the page was removed. Search for a fragrance or start with one of the sections below.'}
        </p>
        <form action={`/${lang}/shop`} className="relative mx-auto mt-9 max-w-xl">
          <Search className="absolute top-1/2 -translate-y-1/2 text-smoke ltr:left-4 rtl:right-4" size={18} />
          <input
            name="q"
            aria-label={ar ? 'ابحث عن عطر' : 'Search fragrances'}
            placeholder={ar ? 'ابحث باسم العطر أو الماركة...' : 'Search by perfume or brand...'}
            className="w-full rounded-full border border-ink-line bg-ink-soft py-4 text-sm text-parchment outline-none focus:border-gold/60 ltr:pl-12 ltr:pr-5 rtl:pr-12 rtl:pl-5"
          />
        </form>
        <Link href={`/${lang}`} className={buttonStyles({ className: 'mt-6' })}>
          <Home size={16} />
          {ar ? 'العودة إلى الرئيسية' : 'Return home'}
        </Link>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-sm border border-ink-line bg-ink-soft p-6 transition-colors hover:border-gold/40"
          >
            <h2 className="font-display text-xl text-parchment">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-smoke">{item.text}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs text-gold-bright">
              {ar ? 'استكشف' : 'Explore'} <Arrow size={15} />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
