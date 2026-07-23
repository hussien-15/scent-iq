'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Bell } from 'lucide-react';
import { requestStockAlert, type StockAlertState } from '@/actions/inventory';
import type ar from '@/dictionaries/ar';

function Button({ dict }: { dict: typeof ar }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="flex items-center justify-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-xs text-gold-bright disabled:opacity-40"><Bell size={13} />{pending ? dict.product.inventory.savingAlert : dict.product.inventory.notifyMe}</button>;
}

export default function StockAlertForm({ perfumeId, dict }: { perfumeId: string; dict: typeof ar }) {
  const initialState: StockAlertState = {};
  const [state, action] = useFormState(requestStockAlert, initialState);
  if (state.success) return <p className="rounded-sm border border-emerald-300/20 bg-emerald-300/5 p-3 text-xs text-emerald-300">{dict.product.inventory.alertSaved}</p>;
  return <form action={action} className="mt-4 flex flex-col gap-2 rounded-sm border border-ink-line p-4 sm:flex-row"><input type="hidden" name="perfumeId" value={perfumeId} /><input name="phone" type="tel" placeholder={dict.product.inventory.phone} className="min-w-0 flex-1 rounded-sm border border-ink-line bg-transparent px-3 py-2 text-xs text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none" /><span className="self-center text-[10px] text-smoke">{dict.product.inventory.or}</span><input name="email" type="email" placeholder={dict.product.inventory.email} className="min-w-0 flex-1 rounded-sm border border-ink-line bg-transparent px-3 py-2 text-xs text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none" /><Button dict={dict} />{state.error && <p className="text-[10px] text-red-200">{dict.product.inventory.alertError}</p>}</form>;
}
