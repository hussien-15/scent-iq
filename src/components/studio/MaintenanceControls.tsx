'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveMaintenanceMode, type MaintenanceActionState } from '@/actions/maintenance';
import type { MaintenanceState } from '@/services/maintenance.service';

const initialState: MaintenanceActionState = {};
const fieldClass =
  'w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment focus:border-gold/40 focus:outline-none';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save maintenance mode'}
    </button>
  );
}

export default function MaintenanceControls({ state }: { state: MaintenanceState }) {
  const [result, action] = useFormState(saveMaintenanceMode, initialState);
  return (
    <form action={action} className="rounded-xl border border-gold/20 bg-gold/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-parchment">Maintenance and ordering</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-smoke">
            Disable ordering without hiding the catalog, or show a branded maintenance page. Perfume Studio remains
            available.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-gold-bright">
          Current: {state.mode}
        </span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr_1fr]">
        <label className="text-[11px] text-smoke">
          Mode
          <select name="mode" defaultValue={state.mode} className={`mt-2 ${fieldClass}`}>
            <option value="OFF">Store and ordering live</option>
            <option value="ORDERING">Catalog live, ordering paused</option>
            <option value="STOREFRONT">Full storefront maintenance</option>
          </select>
        </label>
        <label className="text-[11px] text-smoke">
          Arabic customer message
          <textarea
            name="messageAr"
            dir="rtl"
            rows={4}
            defaultValue={state.messageAr}
            className={`mt-2 ${fieldClass}`}
          />
        </label>
        <label className="text-[11px] text-smoke">
          English customer message
          <textarea name="messageEn" rows={4} defaultValue={state.messageEn} className={`mt-2 ${fieldClass}`} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SubmitButton />
        {result.success && <p className="text-xs text-emerald-300">Saved and storefront cache revalidated.</p>}
        {result.error && <p className="text-xs text-red-200">{result.error}</p>}
      </div>
      {state.source === 'environment' && (
        <p className="mt-3 text-[11px] text-amber-200">
          An environment emergency switch currently overrides this saved setting. Update the hosting variable to release
          it.
        </p>
      )}
    </form>
  );
}
