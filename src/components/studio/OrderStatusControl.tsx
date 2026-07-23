'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus } from '@/actions/order-admin';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'] as const;
const NEXT: Record<string, readonly string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: ['PENDING', 'CONFIRMED'],
  RETURNED: [],
};

export default function OrderStatusControl({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState(currentStatus);
  const [returnToStock, setReturnToStock] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { showToast } = useToast();

  function applyStatus() {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, selected as (typeof STATUSES)[number], note || undefined, returnToStock);
        setConfirmOpen(false);
        showToast({ message: `Order status changed to ${selected.toLowerCase().replaceAll('_', ' ')}.` });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Could not update order';
        setError(message);
        showToast({ message, type: 'error' });
        setSelected(currentStatus);
        setConfirmOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as (typeof STATUSES)[number];
          setSelected(next);
          setError('');
        }}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-parchment disabled:opacity-50"
      >
        {STATUSES.filter((status) => status === currentStatus || NEXT[currentStatus]?.includes(status)).map((s) => (
          <option key={s} value={s} className="bg-ink">
            {s}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note for this change..."
        className="w-56 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-parchment placeholder:text-smoke"
      />
      {selected === 'RETURNED' && (
        <label className="flex items-center gap-2 text-[11px] text-smoke">
          <input
            type="checkbox"
            checked={returnToStock}
            onChange={(event) => setReturnToStock(event.target.checked)}
            className="accent-gold"
          />
          Product inspected and sellable — return it to stock
        </label>
      )}
      <button
        type="button"
        disabled={isPending || selected === currentStatus}
        onClick={() => (['CANCELLED', 'RETURNED'].includes(selected) ? setConfirmOpen(true) : applyStatus())}
        className="rounded-md bg-studioBlue/15 px-3 py-1.5 text-xs text-studioBlue disabled:opacity-40"
      >
        {isPending ? 'Saving…' : 'Apply status'}
      </button>
      {error && <p className="w-full text-[11px] text-red-200">{error}</p>}
      <ConfirmDialog
        open={confirmOpen}
        title={selected === 'RETURNED' ? 'Mark this order as returned?' : 'Cancel this order?'}
        description={
          selected === 'RETURNED'
            ? 'This changes fulfillment reporting and may return inspected items to stock when selected.'
            : 'This stops the active order flow. Add a short note when the customer or team needs context.'
        }
        confirmLabel={selected === 'RETURNED' ? 'Mark returned' : 'Cancel order'}
        cancelLabel="Keep current status"
        danger
        busy={isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={applyStatus}
      />
    </div>
  );
}
