'use client';

import { useEffect, useState } from 'react';

/**
 * Reusable responsive hook — e.g. `useMediaQuery('(min-width: 768px)')`.
 * Returns false on the server and during the first client render to avoid
 * hydration mismatches, then updates once mounted.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', listener);
    return () => mediaQueryList.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
