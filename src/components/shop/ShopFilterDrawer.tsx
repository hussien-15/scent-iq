'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

const FAMILIES = ['oriental', 'fresh', 'woody', 'floral', 'aquatic', 'oud'];
const GENDERS = ['MASCULINE', 'FEMININE', 'UNISEX'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export default function ShopFilterDrawer({ lang }: { lang: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [family, setFamily] = useState(params.get('family') ?? '');
  const [gender, setGender] = useState(params.get('gender') ?? '');
  const [season, setSeason] = useState(params.get('season') ?? '');
  const active = [family, gender, season].filter(Boolean).length;
  const arabic = lang === 'ar';

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  function apply() {
    const next = new URLSearchParams(params.toString());
    [
      ['family', family],
      ['gender', gender],
      ['season', season],
    ].forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  function reset() {
    setFamily('');
    setGender('');
    setSeason('');
  }

  const selectClass = 'field-control';
  return (
    <div className="mb-6 md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center justify-between rounded-full border border-ink-line px-5 text-sm text-parchment"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {arabic ? 'تصفية العطور' : 'Filter perfumes'}
        </span>
        {active > 0 && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] text-ink">{active}</span>}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[105] flex items-end bg-black/70 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
            className="filter-sheet-enter max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-soft p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <header className="mb-6 flex items-center justify-between">
              <h2 id="filter-title" className="font-display text-2xl text-parchment">
                {arabic ? 'تصفية النتائج' : 'Filter results'}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={arabic ? 'إغلاق' : 'Close'}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-line text-smoke"
              >
                <X size={18} />
              </button>
            </header>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs text-smoke">{arabic ? 'العائلة العطرية' : 'Fragrance family'}</span>
                <select value={family} onChange={(event) => setFamily(event.target.value)} className={selectClass}>
                  <option value="">{arabic ? 'الكل' : 'All'}</option>
                  {FAMILIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-smoke">{arabic ? 'الجنس' : 'Gender'}</span>
                <select value={gender} onChange={(event) => setGender(event.target.value)} className={selectClass}>
                  <option value="">{arabic ? 'الكل' : 'All'}</option>
                  {GENDERS.map((value) => (
                    <option key={value} value={value}>
                      {value.toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-smoke">{arabic ? 'الموسم' : 'Season'}</span>
                <select value={season} onChange={(event) => setSeason(event.target.value)} className={selectClass}>
                  <option value="">{arabic ? 'الكل' : 'All'}</option>
                  {SEASONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={reset}
                className="min-h-12 rounded-full border border-ink-line text-sm text-smoke"
              >
                {arabic ? 'مسح الكل' : 'Clear all'}
              </button>
              <button
                type="button"
                onClick={apply}
                className="min-h-12 rounded-full bg-gold text-sm font-medium text-ink"
              >
                {arabic ? 'تطبيق الفلاتر' : 'Apply filters'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
