'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveDeliveryCompany, type DeliveryActionState } from '@/actions/delivery';

const inputClass =
  'w-full rounded-md border border-white/10 bg-ink px-3 py-2.5 text-xs text-parchment placeholder:text-smoke focus:border-gold/40 focus:outline-none';

export type DeliveryEditorData = {
  id?: string;
  name: string;
  contactNumber: string;
  estimatedDays: string;
  status: string;
  notes: string;
  baseFee: string;
  fees: { city: string; area: string | null; fee: string }[];
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-gold px-4 py-2.5 text-xs font-medium text-ink disabled:opacity-40"
    >
      {pending ? 'Saving…' : 'Save company & fees'}
    </button>
  );
}

export default function DeliveryCompanyEditor({
  company,
  open = false,
}: {
  company: DeliveryEditorData;
  open?: boolean;
}) {
  const initial: DeliveryActionState = {};
  const [state, action] = useFormState(saveDeliveryCompany, initial);
  return (
    <details open={open} className="group rounded-xl border border-white/10 bg-white/[0.015]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-lg text-parchment">{company.name || 'Add delivery company'}</h2>
          <p className="mt-1 text-[10px] text-smoke">
            {company.status || 'DISABLED'} · {company.fees.length} fee row(s)
          </p>
        </div>
        <span className="text-smoke transition-transform group-open:rotate-45">+</span>
      </summary>
      <form action={action} className="space-y-4 border-t border-white/10 p-5">
        {company.id && <input type="hidden" name="id" value={company.id} />}
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-[10px] text-smoke">Company name</span>
            <input name="name" required defaultValue={company.name} className={inputClass} />
          </label>
          <label>
            <span className="mb-1 block text-[10px] text-smoke">Contact number</span>
            <input name="contactNumber" defaultValue={company.contactNumber} className={inputClass} />
          </label>
          <label>
            <span className="mb-1 block text-[10px] text-smoke">Estimated delivery time</span>
            <input
              name="estimatedDays"
              required
                  defaultValue={company.estimatedDays || ''}
                  placeholder="Verified estimate, e.g. 3–5 business days"
              className={inputClass}
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] text-smoke">Status</span>
            <select name="status" defaultValue={company.status || 'DISABLED'} className={inputClass}>
              <option>DISABLED</option>
              <option>ACTIVE</option>
              <option>ARCHIVED</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[10px] text-smoke">Base fee · optional</span>
            <input
              name="baseFee"
              type="number"
              min="0"
              step="1"
              defaultValue={company.baseFee}
              className={inputClass}
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] text-smoke">Internal notes</span>
            <input name="notes" defaultValue={company.notes} className={inputClass} />
          </label>
        </div>
        <label>
          <span className="mb-1 block text-[10px] text-smoke">City/area fees · one per line</span>
          <textarea
            name="fees"
            rows={7}
            defaultValue={company.fees
              .map((fee) => `${fee.city}${fee.area ? `/${fee.area}` : ''}=${fee.fee}`)
              .join('\n')}
            placeholder={'Baghdad=5000\nBasra=7000\nErbil/Center=8000'}
            className={inputClass}
          />
          <span className="mt-1 block text-[9px] text-smoke">
            Saving replaces this company’s fee list. Verify every price before activating it.
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Submit />
          {state.success && <span className="text-xs text-emerald-300">Saved.</span>}
          {state.error && <span className="text-xs text-red-200">{state.error}</span>}
        </div>
      </form>
    </details>
  );
}
