'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Search } from 'lucide-react';
import { logSearch, logSearchClick } from '@/actions/search';
import { localized } from '@/utils/localized';
import type { Locale } from '@/lib/i18n';

type Suggestion = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  brand: { id: string; name: string; nameAr: string | null };
};

export default function SearchBar({
  lang,
  placeholder,
  noResultsLabel,
  loadingLabel,
  viewAllResultsLabel,
}: {
  lang: Locale;
  placeholder: string;
  noResultsLabel: string;
  loadingLabel: string;
  viewAllResultsLabel: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    clearTimeout(debounceRef.current);
    const controller = new AbortController();
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setSuggestions(data.success ? data.data.results : []);
        setActiveIndex(-1);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [query]);

  function submitSearch(finalQuery: string) {
    if (!finalQuery.trim()) return;
    logSearch(finalQuery, suggestions.length);
    setOpen(false);
    router.push(`/${lang}/shop?q=${encodeURIComponent(finalQuery)}`);
  }

  function openSuggestion(suggestion: Suggestion) {
    void logSearch(query, suggestions.length);
    void logSearchClick(query, { perfumeId: suggestion.id });
    setOpen(false);
    router.push(`/${lang}/product/${suggestion.slug}`);
  }

  return (
    <div className="relative mx-auto max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(query);
        }}
        className="relative"
      >
        <Search
          size={18}
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-smoke ltr:left-4 rtl:right-4"
        />
        <input
          role="combobox"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (!open || suggestions.length === 0) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((index) => (index + 1) % suggestions.length);
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
            } else if (event.key === 'Enter' && activeIndex >= 0) {
              event.preventDefault();
              openSuggestion(suggestions[activeIndex]);
            } else if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          aria-autocomplete="list"
          aria-expanded={open && query.trim().length >= 2}
          aria-controls="search-suggestions"
          placeholder={placeholder}
          className="w-full rounded-full border border-ink-line bg-ink-soft py-4 text-sm text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none ltr:pl-11 ltr:pr-5 rtl:pr-11 rtl:pl-5"
        />
      </form>

      {open && query.trim().length >= 2 && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-ink-line bg-ink-soft shadow-lg"
        >
          {loading ? (
            <p className="flex items-center gap-2 px-5 py-4 text-sm text-smoke">
              <LoaderCircle size={15} className="animate-spin" /> {loadingLabel}
            </p>
          ) : suggestions.length === 0 ? (
            <p className="px-5 py-4 text-sm text-smoke">{noResultsLabel}</p>
          ) : (
            <>
              {suggestions.map((s, index) => (
                <button
                  key={s.slug}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    openSuggestion(s);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center justify-between px-5 py-3 text-start transition-colors ${
                    activeIndex === index ? 'bg-ink' : 'hover:bg-ink'
                  }`}
                >
                  <span className="text-sm text-parchment">{localized(lang, s.nameEn, s.nameAr)}</span>
                  <span className="eyebrow">{localized(lang, s.brand.name, s.brand.nameAr)}</span>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  submitSearch(query);
                }}
                className="w-full border-t border-ink-line px-5 py-3 text-start text-xs text-gold-bright hover:bg-ink transition-colors"
              >
                {viewAllResultsLabel}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
