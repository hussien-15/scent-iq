import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import StudioPagination from '@/components/studio/StudioPagination';

export const dynamic = 'force-dynamic';

export default async function StudioActivityPage({ searchParams }: { searchParams: { q?: string; admin?: string; action?: string; entity?: string; from?: string; to?: string; page?: string } }) {
  await requirePermission('activity.view');
  const from = searchParams.from ? new Date(`${searchParams.from}T00:00:00+03:00`) : undefined;
  const to = searchParams.to ? new Date(`${searchParams.to}T23:59:59.999+03:00`) : undefined;
  const pageSize = 50;
  const requestedPage = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1);
  const where = {
    ...(searchParams.admin ? { adminId: searchParams.admin } : {}),
    ...(searchParams.action ? { action: searchParams.action } : {}),
    ...(searchParams.entity ? { affectedType: searchParams.entity } : {}),
    ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
    ...(searchParams.q ? { OR: [{ action: { contains: searchParams.q, mode: 'insensitive' as const } }, { affectedName: { contains: searchParams.q, mode: 'insensitive' as const } }, { actorName: { contains: searchParams.q, mode: 'insensitive' as const } }] } : {}),
  };
  const total = await prisma.activityLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const [logs, admins, actionRows, entityRows] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      include: { admin: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({ where: { role: 'ADMIN' }, orderBy: { name: 'asc' }, select: { id: true, name: true, email: true } }),
    prisma.activityLog.groupBy({ by: ['action'], orderBy: { action: 'asc' }, take: 100 }),
    prisma.activityLog.groupBy({ by: ['affectedType'], orderBy: { affectedType: 'asc' }, take: 100 }),
  ]);
  const field = 'rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment';
  return <div className="space-y-6 pb-12"><header><p className="eyebrow mb-2">Immutable operational trail</p><h1 className="font-display text-3xl text-parchment">Activity logs</h1><p className="mt-2 text-xs text-smoke">Paginated newest matching events. Failed logins use hashed identifiers and never expose raw IP addresses.</p></header>
    <form className="grid gap-3 rounded-xl border border-white/10 p-4 md:grid-cols-3 xl:grid-cols-6"><input name="q" defaultValue={searchParams.q} placeholder="Search action or item" className={field} /><select name="admin" defaultValue={searchParams.admin ?? ''} className={field}><option value="">All admins</option>{admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.name ?? admin.email}</option>)}</select><select name="action" defaultValue={searchParams.action ?? ''} className={field}><option value="">All actions</option>{actionRows.map((row) => <option key={row.action}>{row.action}</option>)}</select><select name="entity" defaultValue={searchParams.entity ?? ''} className={field}><option value="">All entities</option>{entityRows.map((row) => <option key={row.affectedType}>{row.affectedType}</option>)}</select><input type="date" name="from" defaultValue={searchParams.from} className={field} /><input type="date" name="to" defaultValue={searchParams.to} className={field} /><div className="flex gap-2 xl:col-span-6"><button className="rounded-md bg-gold px-4 py-2 text-xs text-ink">Apply filters</button><a href="/studio/activity" className="rounded-md border border-white/10 px-4 py-2 text-xs text-smoke">Clear</a></div></form>
    {logs.length === 0 ? <p className="rounded-xl border border-white/10 p-8 text-center text-sm text-smoke">No matching activity.</p> : <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[850px] text-start text-xs"><thead className="border-b border-white/10 text-smoke"><tr><th className="p-3 font-normal">Admin</th><th className="p-3 font-normal">Action</th><th className="p-3 font-normal">Entity</th><th className="p-3 font-normal">Affected item</th><th className="p-3 font-normal">Time</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-b border-white/5 last:border-0"><td className="p-3 text-parchment">{log.admin?.name ?? log.actorName ?? log.admin?.email ?? 'System / unknown'}</td><td className="p-3 text-smoke">{log.action}</td><td className="p-3 text-smoke">{log.affectedType}</td><td className="p-3 text-smoke">{log.affectedName}</td><td className="p-3 text-smoke">{log.createdAt.toLocaleString('en-IQ', { timeZone: 'Asia/Baghdad' })}</td></tr>)}</tbody></table></div>}
    <StudioPagination path="/studio/activity" searchParams={searchParams} page={page} totalPages={totalPages} total={total} />
  </div>;
}
