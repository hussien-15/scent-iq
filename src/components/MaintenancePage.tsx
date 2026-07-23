import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import type { MaintenanceState } from '@/services/maintenance.service';

export default function MaintenancePage({ lang, state }: { lang: Locale; state: MaintenanceState }) {
  const arabic = lang === 'ar';
  const whatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,154,62,0.13),transparent_45%)]" />
      <div className="relative max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-gold/35 bg-gold/5 font-display text-3xl text-gold-bright">
          S
        </div>
        <p className="eyebrow mb-4">ScentIQ · {arabic ? 'تحديث مجدول' : 'Scheduled update'}</p>
        <h1 className="font-display text-4xl text-parchment sm:text-5xl">
          {arabic ? 'ScentIQ قيد التحديث' : 'ScentIQ is being updated'}
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-smoke">
          {arabic
            ? 'نعمل على تحسين التجربة، وسنعود قريبًا. شكرًا لصبرك.'
            : 'We are improving the experience and will be back shortly. Thank you for your patience.'}
        </p>
        {(arabic ? state.messageAr : state.messageEn) && (
          <p className="mx-auto mt-3 max-w-lg text-xs leading-6 text-smoke/75">
            {arabic ? state.messageAr : state.messageEn}
          </p>
        )}
        {whatsapp && (
          <Link
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
            className="mt-8 inline-flex rounded-full border border-gold/35 px-6 py-3 text-xs text-gold-bright"
          >
            {arabic ? 'تواصل معنا عبر واتساب' : 'Contact us on WhatsApp'}
          </Link>
        )}
        <p className="mt-10 text-[11px] uppercase tracking-[0.24em] text-smoke/60">Your scent, powered by IQ.</p>
      </div>
    </main>
  );
}
