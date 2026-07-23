'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveStoreSetup, type SetupActionState } from '@/actions/setup';

const inputClass = 'w-full rounded-md border border-white/10 bg-ink px-3 py-2.5 text-xs text-parchment focus:border-gold/40 focus:outline-none';

function SaveButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-md bg-gold px-5 py-2.5 text-xs font-medium text-ink disabled:opacity-40">{pending ? 'Validating…' : 'Save setup'}</button>;
}

export default function SetupControls({ defaults }: { defaults: { name: string; tagline: string; currency: string; primaryLanguage: string; launchStatus: string } }) {
  const initial: SetupActionState = {};
  const [state, action] = useFormState(saveStoreSetup, initial);
  return <form action={action} className="space-y-4 rounded-xl border border-white/10 p-5"><div><p className="eyebrow mb-2">Store identity & launch gate</p><h2 className="font-display text-xl text-parchment">Setup controls</h2></div><div className="grid gap-4 md:grid-cols-2"><label><span className="mb-1 block text-[10px] text-smoke">Store name</span><input name="name" required defaultValue={defaults.name} className={inputClass} /></label><label><span className="mb-1 block text-[10px] text-smoke">Tagline</span><input name="tagline" required defaultValue={defaults.tagline} className={inputClass} /></label><label><span className="mb-1 block text-[10px] text-smoke">Currency</span><select name="currency" defaultValue={defaults.currency} className={inputClass}><option value="IQD">IQD — Iraqi dinar</option><option value="USD">USD</option></select></label><label><span className="mb-1 block text-[10px] text-smoke">Primary language</span><select name="primaryLanguage" defaultValue={defaults.primaryLanguage} className={inputClass}><option value="ar">Arabic</option><option value="en">English</option></select></label><label className="md:col-span-2"><span className="mb-1 block text-[10px] text-smoke">Launch status</span><select name="launchStatus" defaultValue={defaults.launchStatus} className={inputClass}><option value="SETUP">Setup Mode — configuration only, no indexing</option><option value="PREVIEW">Preview Mode — review storefront, no indexing</option><option value="LIVE">Live Mode — public and indexable after safety checks</option></select></label></div><div className="flex flex-wrap items-center gap-3"><SaveButton />{state.success && <span className="text-xs text-emerald-300">Setup saved.</span>}{state.error && <span className="max-w-2xl text-xs text-red-200">{state.error}</span>}</div></form>;
}
