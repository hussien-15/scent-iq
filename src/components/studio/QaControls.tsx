'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createQaBug, updateLaunchApproval, updateQaBug, updateQaCheck, type QaActionState } from '@/actions/qa';

const input =
  'w-full rounded-md border border-white/10 bg-ink px-3 py-2.5 text-xs text-parchment outline-none focus:border-gold/50';

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-md bg-gold px-4 py-2.5 text-xs font-medium text-ink disabled:opacity-50"
    >
      {pending ? 'Saving…' : children}
    </button>
  );
}

function Result({ state }: { state: QaActionState }) {
  if (state.error) return <p className="text-xs text-red-200">{state.error}</p>;
  if (state.success) return <p className="text-xs text-emerald-300">Saved.</p>;
  return null;
}

export function QaCheckForm({
  check,
}: {
  check: {
    id: string;
    status: string;
    environment: string | null;
    device: string | null;
    browser: string | null;
    evidence: string | null;
    notes: string | null;
  };
}) {
  const [state, action] = useFormState(updateQaCheck, {});
  return (
    <form action={action} className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-2">
      <input type="hidden" name="id" value={check.id} />
      <label>
        <span className="mb-1 block text-[10px] text-smoke">Result</span>
        <select name="status" defaultValue={check.status} className={input}>
          {['NOT_TESTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'NOT_APPLICABLE'].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-1 block text-[10px] text-smoke">Environment</span>
        <input name="environment" defaultValue={check.environment ?? 'staging'} className={input} />
      </label>
      <input name="device" defaultValue={check.device ?? ''} placeholder="Device / viewport" className={input} />
      <input name="browser" defaultValue={check.browser ?? ''} placeholder="Browser and version" className={input} />
      <input
        name="evidence"
        defaultValue={check.evidence ?? ''}
        placeholder="Evidence URL, test ID, or concise result"
        className={`${input} md:col-span-2`}
      />
      <textarea
        name="notes"
        defaultValue={check.notes ?? ''}
        placeholder="Notes, data used, regression scope, or blocker"
        rows={3}
        className={`${input} md:col-span-2`}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
        <Result state={state} />
        <Submit>Save test evidence</Submit>
      </div>
    </form>
  );
}

type AdminOption = { id: string; name: string | null; email: string };

export function CreateBugForm({ admins }: { admins: AdminOption[] }) {
  const [state, action] = useFormState(createQaBug, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <input
        name="title"
        required
        minLength={5}
        maxLength={180}
        placeholder="Concise bug title"
        className={`${input} md:col-span-2`}
      />
      <textarea
        name="description"
        required
        minLength={10}
        rows={3}
        placeholder="Impact and context"
        className={`${input} md:col-span-2`}
      />
      <textarea
        name="reproductionSteps"
        required
        minLength={10}
        rows={4}
        placeholder={'Reproduction steps\n1. Open…\n2. Enter…\n3. Observe…'}
        className={input}
      />
      <div className="grid gap-3">
        <textarea name="expectedResult" required placeholder="Expected result" className={input} />
        <textarea name="actualResult" required placeholder="Actual result" className={input} />
      </div>
      <select name="severity" defaultValue="MEDIUM" className={input}>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <input name="environment" required defaultValue="staging" placeholder="Environment" className={input} />
      <input name="device" placeholder="Device / viewport" className={input} />
      <input name="browser" placeholder="Browser and version" className={input} />
      <input name="route" placeholder="Affected route" className={input} />
      <input name="screenshotUrl" type="url" placeholder="Screenshot URL (optional)" className={input} />
      <select name="assigneeId" defaultValue="" className={input}>
        <option value="">Unassigned</option>
        {admins.map((admin) => (
          <option key={admin.id} value={admin.id}>
            {admin.name ?? admin.email}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
        <Result state={state} />
        <Submit>Report bug</Submit>
      </div>
    </form>
  );
}

export function UpdateBugForm({
  bug,
  admins,
}: {
  bug: { id: string; status: string; severity: string; assigneeId: string | null };
  admins: AdminOption[];
}) {
  const [state, action] = useFormState(updateQaBug, {});
  return (
    <form action={action} className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
      <input type="hidden" name="id" value={bug.id} />
      <select name="severity" defaultValue={bug.severity} className={input}>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <select name="status" defaultValue={bug.status} className={input}>
        {['OPEN', 'IN_PROGRESS', 'FIXED', 'NEEDS_REVIEW', 'VERIFIED', 'CLOSED'].map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <select name="assigneeId" defaultValue={bug.assigneeId ?? ''} className={input}>
        <option value="">Unassigned</option>
        {admins.map((admin) => (
          <option key={admin.id} value={admin.id}>
            {admin.name ?? admin.email}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
        <Result state={state} />
        <Submit>Update bug</Submit>
      </div>
    </form>
  );
}

export function LaunchApprovalForm({
  approval,
}: {
  approval: { area: string; approved: boolean; notes: string | null };
}) {
  const [state, action] = useFormState(updateLaunchApproval, {});
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="area" value={approval.area} />
      <label className="flex min-h-11 items-center gap-2 text-xs text-parchment">
        <input type="checkbox" name="approved" defaultChecked={approval.approved} className="size-4 accent-gold" />I
        approve this launch area based on recorded evidence
      </label>
      <textarea
        name="notes"
        defaultValue={approval.notes ?? ''}
        rows={2}
        placeholder="Approval scope or remaining note"
        className={input}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Result state={state} />
        <Submit>Save approval</Submit>
      </div>
    </form>
  );
}
