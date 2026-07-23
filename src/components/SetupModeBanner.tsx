import type { Locale } from '@/lib/i18n';

export default function SetupModeBanner({ lang, mode }: { lang: Locale; mode: 'SETUP' | 'PREVIEW' }) {
  return (
    <div
      role="status"
      data-mode={mode.toLowerCase()}
      className="border-b border-studioBlue/20 bg-studioBlue/[0.07] px-4 py-2.5 text-center text-[11px] leading-5 text-blue-100"
    >
      {lang === 'ar'
        ? 'المتجر قيد التجهيز — سيتم إطلاق ScentIQ قريبًا بتجربة عطور ذكية ومميزة.'
        : 'The store is being prepared — ScentIQ will launch soon with a distinctive, intelligent fragrance experience.'}
    </div>
  );
}
