'use client';

import { useTransition } from 'react';
import { Check } from 'lucide-react';
import { resolveInventoryNotification } from '@/actions/inventory';

export default function ResolveInventoryAlert({ notificationId }: { notificationId: string }) {
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} onClick={() => startTransition(() => resolveInventoryNotification(notificationId))} title="Resolve notification" className="rounded-md border border-white/10 p-1.5 text-smoke hover:text-emerald-300 disabled:opacity-40"><Check size={12} /></button>;
}
