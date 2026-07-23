import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/authorization';
import { ADMIN_ROLE_LABELS, normalizeAdminRole } from '@/lib/permissions';
import { CreateAdminForm, EditAdminForm } from '@/components/studio/AdminUserForms';

export const dynamic = 'force-dynamic';

export default async function StudioAdminsPage() {
  await requireSuperAdmin();
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, orderBy: [{ adminStatus: 'asc' }, { createdAt: 'asc' }], select: { id: true, name: true, email: true, adminRole: true, adminStatus: true, lastLoginAt: true, createdAt: true } });
  return <div className="space-y-7 pb-12">
    <header><p className="eyebrow mb-2">Super Admin only</p><h1 className="font-display text-3xl text-parchment">Admin users & permissions</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-smoke">Create role-scoped accounts, disable access immediately, and force old sessions to re-authenticate whenever a role or status changes.</p></header>
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5"><h2 className="mb-4 font-display text-xl text-parchment">Create admin</h2><CreateAdminForm /></section>
    <section className="space-y-3">{admins.map((admin) => { const role = normalizeAdminRole(admin.adminRole); const status = admin.adminStatus ?? 'ACTIVE'; return <details key={admin.id} className="rounded-xl border border-white/10 bg-white/[0.015] p-5"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-medium text-parchment">{admin.name ?? 'Unnamed admin'}</p><p className="mt-1 text-xs text-smoke">{admin.email}</p></div><div className="text-end"><p className="text-xs text-studioBlue">{ADMIN_ROLE_LABELS[role]}</p><p className={`mt-1 text-[10px] ${status === 'ACTIVE' ? 'text-emerald-300' : 'text-amber-200'}`}>{status}</p></div></div><div className="mt-3 flex gap-5 text-[10px] text-smoke"><span>Created {admin.createdAt.toLocaleDateString()}</span><span>Last login {admin.lastLoginAt ? admin.lastLoginAt.toLocaleString() : 'Never'}</span></div></summary><EditAdminForm admin={admin} /></details>; })}</section>
    <p className="text-[11px] leading-5 text-smoke">Password reset tokens and two-factor flags are prepared in the data model. Automated reset email and 2FA delivery remain disabled until a trusted email/auth channel is configured.</p>
  </div>;
}
