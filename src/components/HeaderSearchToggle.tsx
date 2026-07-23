'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export default function HeaderSearchToggle({
  lang,
  placeholder,
}: {
  lang: Locale;
  placeholder: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    router.push(`/${lang}/shop?q=${encodeURIComponent(value)}`);
    setOpen(false);
    setValue('');
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={placeholder}
        className="flex h-11 w-11 items-center justify-center text-smoke hover:text-parchment transition-colors"
      >
        <Search size={18} />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="absolute inset-x-4 top-1 z-10 flex h-12 items-center gap-2 bg-ink sm:static sm:h-auto sm:bg-transparent">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border border-ink-line bg-ink-soft px-4 py-3 text-sm text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none sm:w-56 sm:flex-none sm:py-2 sm:text-xs"
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close"
        className="flex h-11 w-11 shrink-0 items-center justify-center text-smoke hover:text-parchment transition-colors"
      >
        <X size={16} />
      </button>
    </form>
  );
}
