'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createAdmin, updateAdmin, type AdminActionState } from '@/actions/admin';
import { ADMIN_ROLE_LABELS, type AdminRoleName } from '@/lib/permissions';

const roles = Object.entries(ADMIN_ROLE_LABELS) as Array<[AdminRoleName, string]>;
const statuses = ['ACTIVE', 'DISABLED', 'SUSPENDED', 'PENDING'] as const;
const input = 'w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment outline-none focus:border-gold/50';

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink disabled:opacity-60">{pending ? 'Saving…' : children}</button>;
}

function Message({ state }: { state: AdminActionState }) {
  if (state.error) return <p className="text-xs text-red-200">{state.error}</p>;
  if (state.success) return <p className="text-xs text-emerald-300">Saved securely.</p>;
  return null;
}

export function CreateAdminForm() {
  const [state, action] = useFormState(createAdmin, {});
  return <form action={action} className="grid gap-3 md:grid-cols-2"><input name="name" required minLength={2} maxLength={100} placeholder="Full name" className={input} /><input name="email" required type="email" maxLength={254} placeholder="Email" className={input} /><input name="password" required type="password" minLength={12} maxLength={128} autoComplete="new-password" placeholder="Strong temporary password" className={input} /><select name="adminRole" defaultValue="VIEWER" className={input}>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="adminStatus" defaultValue="ACTIVE" className={input}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><div className="flex items-center justify-between gap-3"><Message state={state} /><Submit>Create admin</Submit></div><p className="text-[10px] text-smoke md:col-span-2">Password: 12+ characters with uppercase, lowercase, number and special character. Share it outside the site through a trusted channel.</p></form>;
}

export function EditAdminForm({ admin }: { admin: { id: string; name: string | null; adminRole: string | null; adminStatus: string | null } }) {
  const bound = updateAdmin.bind(null, admin.id);
  const [state, action] = useFormState(bound, {});
  return <form action={action} className="mt-4 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-3"><input name="name" required minLength={2} maxLength={100} defaultValue={admin.name ?? ''} className={input} /><select name="adminRole" defaultValue={admin.adminRole ?? 'SUPER_ADMIN'} className={input}>{roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="adminStatus" defaultValue={admin.adminStatus ?? 'ACTIVE'} className={input}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><div className="flex items-center justify-between gap-3 sm:col-span-3"><Message state={state} /><Submit>Update access</Submit></div></form>;
}
