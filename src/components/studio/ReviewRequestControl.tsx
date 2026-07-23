'use client';

import { useState, useTransition } from 'react';
import { Check, Clipboard, MessageCircle } from 'lucide-react';
import { markOrderReviewRequest } from '@/actions/review';

export default function ReviewRequestControl({
  orderId,
  delivered,
  markedAt,
  products,
}: {
  orderId: string;
  delivered: boolean;
  markedAt: string | null;
  products: { name: string; slug: string }[];
}) {
  const [marked, setMarked] = useState(Boolean(markedAt));
  const [copied, setCopied] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!delivered) return <p className="text-xs text-smoke">Available after this order is marked as delivered.</p>;

  function markReady() {
    startTransition(async () => { await markOrderReviewRequest(orderId); setMarked(true); });
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/ar/product/${slug}#reviews`;
    navigator.clipboard.writeText(url).then(() => { setCopied(slug); window.setTimeout(() => setCopied(null), 1800); });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="flex items-center gap-2 text-sm text-parchment"><MessageCircle size={15} className="text-gold" />Manual review request</p><p className="mt-1 text-[11px] text-smoke">No SMS, WhatsApp, or email is sent automatically in this version.</p></div>
        <button type="button" disabled={marked || isPending} onClick={markReady} className="rounded-md border border-gold/30 px-3 py-2 text-xs text-gold-bright disabled:opacity-50">{marked ? 'Marked ready' : isPending ? 'Saving…' : 'Mark ready for request'}</button>
      </div>
      {marked && <div className="space-y-2 border-t border-white/10 pt-3">{products.map((product) => <div key={product.slug} className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-smoke">{product.name}</span><button type="button" onClick={() => copyLink(product.slug)} className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-parchment">{copied === product.slug ? <Check size={12} /> : <Clipboard size={12} />}{copied === product.slug ? 'Copied' : 'Copy review link'}</button></div>)}</div>}
    </div>
  );
}
