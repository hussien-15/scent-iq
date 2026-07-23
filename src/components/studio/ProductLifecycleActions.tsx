'use client';

import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Copy, Eye } from 'lucide-react';
import { archiveProduct, duplicateProduct } from '@/actions/product';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';

type Intent = 'duplicate' | 'archive' | null;

export default function ProductLifecycleActions({ productId }: { productId: string }) {
  const [intent, setIntent] = useState<Intent>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();
  const close = useCallback(() => setIntent(null), []);

  function confirm() {
    if (!intent) return;
    startTransition(async () => {
      try {
        if (intent === 'duplicate') {
          const copy = await duplicateProduct(productId);
          showToast({ message: 'A draft copy was created without copying stock or sales data.', type: 'success' });
          router.push(`/studio/products/${copy.id}`);
        } else {
          await archiveProduct(productId);
          showToast({ message: 'Product archived. Historical orders and inventory records were preserved.', type: 'success' });
          router.push('/studio/products');
        }
        router.refresh();
        setIntent(null);
      } catch (error) {
        showToast({ message: error instanceof Error ? error.message : 'The product action could not be completed.', type: 'error' });
      }
    });
  }

  return <>
    <div className="grid gap-2">
      <Link href={`/studio/products/${productId}/preview`} target="_blank" className="flex items-center justify-center gap-2 rounded-md border border-gold/30 px-4 py-2.5 text-xs text-gold-bright hover:border-gold"><Eye size={14} /> Preview product</Link>
      <button type="button" onClick={() => setIntent('duplicate')} className="flex items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-xs text-smoke hover:border-white/20 hover:text-parchment"><Copy size={14} /> Duplicate as draft</button>
      <button type="button" onClick={() => setIntent('archive')} className="flex items-center justify-center gap-2 rounded-md border border-red-300/20 px-4 py-2.5 text-xs text-red-200 hover:border-red-300/40"><Archive size={14} /> Archive product</button>
    </div>
    <ConfirmDialog
      open={intent !== null}
      title={intent === 'archive' ? 'Archive this product?' : 'Create a draft copy?'}
      description={intent === 'archive'
        ? 'The product will disappear from the storefront. Orders, stock history and audit records will remain available.'
        : 'Content, notes, tags and media will be copied. Stock, variants, sales counters and barcode will not be copied.'}
      confirmLabel={intent === 'archive' ? 'Archive product' : 'Create copy'}
      cancelLabel="Cancel"
      onConfirm={confirm}
      onClose={close}
      busy={pending}
      danger={intent === 'archive'}
    />
  </>;
}
