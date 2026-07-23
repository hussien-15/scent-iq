'use client';

import { useCallback, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { trackAnalyticsEvent } from '@/lib/analytics-client';
import type { Locale } from '@/lib/i18n';

export function StorefrontPageTracker({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    trackAnalyticsEvent({ event: 'PAGE_VIEW', pathname });
  }, [pathname, query]);

  const reportMetric = useCallback((metric: { id: string; name: string; value: number; delta: number; rating?: string; navigationType?: string }) => {
    if (!['CLS', 'FCP', 'INP', 'LCP', 'TTFB'].includes(metric.name)) return;
    const sampleKey = 'scentiq-vitals-sample';
    let sampled = window.sessionStorage.getItem(sampleKey);
    if (sampled == null) {
      const configured = Number(process.env.NEXT_PUBLIC_WEB_VITAL_SAMPLE_RATE ?? '0.1');
      const sampleRate = Number.isFinite(configured) ? Math.min(1, Math.max(0, configured)) : 0.1;
      sampled = Math.random() < sampleRate ? '1' : '0';
      window.sessionStorage.setItem(sampleKey, sampled);
    }
    if (sampled !== '1') return;

    const body = JSON.stringify({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating ?? 'good',
      pathname: window.location.pathname,
      locale,
      navigationType: metric.navigationType,
    });
    const blob = new Blob([body], { type: 'application/json' });
    if (!navigator.sendBeacon('/api/analytics/vitals', blob)) {
      void fetch('/api/analytics/vitals', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    }
  }, [locale]);
  useReportWebVitals(reportMetric);

  return null;
}

export function ProductViewTracker({ perfumeId, brandId }: { perfumeId: string; brandId: string }) {
  useEffect(() => {
    trackAnalyticsEvent({ event: 'PRODUCT_VIEW', perfumeId, brandId });
  }, [brandId, perfumeId]);

  return null;
}

export function RecommendationImpressionTracker({
  perfumeIds,
  recommendationType,
}: {
  perfumeIds: string[];
  recommendationType: string;
}) {
  const ids = perfumeIds.join(',');
  useEffect(() => {
    for (const perfumeId of perfumeIds) {
      trackAnalyticsEvent({
        event: 'RECOMMENDATION_IMPRESSION',
        perfumeId,
        metadata: { recommendationType },
      });
    }
    // `ids` is the stable signal; callers construct a new array on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, recommendationType]);

  return null;
}
