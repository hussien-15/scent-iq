'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function StorefrontError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const lang = pathname?.startsWith('/en') ? 'en' : 'ar';
  const ar = lang === 'ar';
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="eyebrow mb-3">{ar ? 'تعذّر تحميل الصفحة' : 'Page could not load'}</p>
      <h1 className="font-display text-3xl text-parchment">{ar ? 'صار خطأ مؤقت' : 'Something temporary went wrong'}</h1>
      <p className="mt-4 text-sm leading-7 text-smoke">{ar ? 'اتصالك وطلبك بأمان. جرّب مرة ثانية، أو ارجع للرئيسية.' : 'Your connection and order are safe. Try again or return home.'}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={reset} className="min-h-11 rounded-full bg-gold px-6 text-sm font-medium text-ink">{ar ? 'إعادة المحاولة' : 'Try again'}</button><Link href={`/${lang}`} className="flex min-h-11 items-center rounded-full border border-ink-line px-6 text-sm text-parchment">{ar ? 'الرئيسية' : 'Home'}</Link></div>
    </div>
  );
}
