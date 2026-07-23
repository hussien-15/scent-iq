'use client';

import { useEffect } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

export type CollectionEvent = 'VIEW' | 'PRODUCT_CLICK' | 'ADD_TO_CART';

export function trackCollectionEvent(
  collectionId: string,
  event: CollectionEvent,
  perfumeId?: string
) {
  trackAnalyticsEvent({
    event: event === 'VIEW'
      ? 'COLLECTION_VIEW'
      : event === 'PRODUCT_CLICK'
        ? 'COLLECTION_PRODUCT_CLICK'
        : 'COLLECTION_ADD_TO_CART',
    collectionId,
    perfumeId,
  });
  const body = JSON.stringify({ collectionId, event, perfumeId });
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    navigator.sendBeacon('/api/collections/track', new Blob([body], { type: 'application/json' }));
    return;
  }
  void fetch('/api/collections/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}

export default function CollectionTracker({ collectionId }: { collectionId: string }) {
  useEffect(() => {
    trackCollectionEvent(collectionId, 'VIEW');
  }, [collectionId]);

  return null;
}
