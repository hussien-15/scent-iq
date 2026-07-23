'use client';

import { useState, useTransition } from 'react';
import { addOrderInternalNote } from '@/actions/order-admin';

export default function OrderInternalNotes({
  orderId,
  initialNote,
}: {
  orderId: string;
  initialNote: string;
}) {
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Private notes — never shown to the customer..."
        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-parchment placeholder:text-smoke"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await addOrderInternalNote(orderId, note);
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          })
        }
        className="mt-2 rounded-md bg-studioBlue/20 px-3 py-1.5 text-xs text-studioBlue hover:bg-studioBlue/30 disabled:opacity-50"
      >
        {saved ? 'Saved ✓' : 'Save note'}
      </button>
    </div>
  );
}
