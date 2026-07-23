import type { Locale } from '@/lib/i18n';
import type { MaintenanceState } from '@/services/maintenance.service';

export default function MaintenanceBanner({ lang, state }: { lang: Locale; state: MaintenanceState }) {
  return (
    <div
      role="status"
      className="border-b border-gold/25 bg-gold/10 px-4 py-3 text-center text-xs leading-5 text-parchment"
    >
      <span className="font-medium text-gold-bright">
        {lang === 'ar' ? 'الطلبات متوقفة مؤقتًا — ' : 'Ordering is temporarily paused — '}
      </span>
      {lang === 'ar' ? state.messageAr : state.messageEn}
    </div>
  );
}
