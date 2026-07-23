'use client';

import { useState, useTransition } from 'react';
import { updateProductStatus } from '@/actions/product';
import { statusLabel } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const STATUSES = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'DISCONTINUED'] as const;

export default function StatusSelect({ perfumeId, currentStatus }: { perfumeId: string; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const [selected, setSelected] = useState(currentStatus);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function applyStatus(next: (typeof STATUSES)[number]) {
    startTransition(async () => {
      try {
        await updateProductStatus(perfumeId, next);
        setSelected(next);
        setConfirmOpen(false);
        showToast({ message: `Product status changed to ${statusLabel(next).toLowerCase()}.` });
      } catch {
        setSelected(currentStatus);
        setConfirmOpen(false);
        showToast({
          message: 'Product status could not be changed. Check the required product details and try again.',
          type: 'error',
        });
      }
    });
  }

  return (
    <>
      <select
        value={selected}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as (typeof STATUSES)[number];
          setSelected(next);
          if (['ARCHIVED', 'DISCONTINUED', 'HIDDEN'].includes(next)) setConfirmOpen(true);
          else applyStatus(next);
        }}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-parchment disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="bg-ink">
            {statusLabel(s)}
          </option>
        ))}
      </select>
      <ConfirmDialog
        open={confirmOpen}
        title={`Change product status to ${statusLabel(selected).toLowerCase()}?`}
        description="This can remove the product from active customer discovery. Confirm only after checking current orders and inventory."
        confirmLabel="Change status"
        cancelLabel="Keep current status"
        danger
        busy={isPending}
        onClose={() => {
          setSelected(currentStatus);
          setConfirmOpen(false);
        }}
        onConfirm={() => applyStatus(selected as (typeof STATUSES)[number])}
      />
    </>
  );
}
