'use client';

export type AnalyticsEventName =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'CHECKOUT_STARTED'
  | 'WISHLIST_ADDED'
  | 'WISHLIST_REMOVED'
  | 'COLLECTION_VIEW'
  | 'COLLECTION_PRODUCT_CLICK'
  | 'COLLECTION_ADD_TO_CART'
  | 'RECOMMENDATION_IMPRESSION'
  | 'RECOMMENDATION_CLICK';

type AnalyticsPayload = {
  event: AnalyticsEventName;
  perfumeId?: string;
  brandId?: string;
  collectionId?: string;
  pathname?: string;
  value?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

const SESSION_KEY = 'scentiq-analytics-session';
const TRAFFIC_KEY = 'scentiq-analytics-traffic';

export function getAnalyticsSessionId() {
  if (typeof window === 'undefined') return undefined;
  let sessionId = window.sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function trafficContext() {
  if (typeof window === 'undefined') return {};
  const saved = window.sessionStorage.getItem(TRAFFIC_KEY);
  if (saved) {
    try { return JSON.parse(saved) as { referrer?: string; campaign?: string; source?: string }; }
    catch { window.sessionStorage.removeItem(TRAFFIC_KEY); }
  }
  const params = new URLSearchParams(window.location.search);
  let externalReferrer: string | undefined;
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      if (referrerUrl.origin !== window.location.origin) externalReferrer = document.referrer;
    } catch { /* Ignore malformed browser referrers. */ }
  }
  const context = {
    referrer: externalReferrer,
    campaign: params.get('utm_campaign') || undefined,
    source: params.get('utm_source') || undefined,
  };
  window.sessionStorage.setItem(TRAFFIC_KEY, JSON.stringify(context));
  return context;
}

export function trackAnalyticsEvent(payload: AnalyticsPayload) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({
    ...payload,
    sessionId: getAnalyticsSessionId(),
    pathname: payload.pathname ?? window.location.pathname,
    ...trafficContext(),
  });

  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics/event', new Blob([body], { type: 'application/json' }));
    return;
  }

  void fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}
