import { prisma } from '@/lib/prisma';
import StudioPagination from '@/components/studio/StudioPagination';
import EmptyState from '@/components/ui/EmptyState';
import { SearchX, Users } from 'lucide-react';
import { formatPrice } from '@/utils/format-price';

export const dynamic = 'force-dynamic';

export default async function StudioCustomersPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const pageSize = 25;
  const requestedPage = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1);
  const where = {
    role: 'CUSTOMER' as const,
    ...(searchParams.q
      ? {
          OR: [
            { name: { contains: searchParams.q, mode: 'insensitive' as const } },
            { email: { contains: searchParams.q, mode: 'insensitive' as const } },
            { phone: { contains: searchParams.q } },
          ],
        }
      : {}),
  };
  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const customers = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      totalSpending: true,
      _count: { select: { orders: true, wishlist: true, reviews: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-parchment">Customers</h1>
      <form className="flex max-w-lg gap-3">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name, email, or phone…"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-parchment placeholder:text-smoke"
        />
        <button className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink">Search</button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          icon={searchParams.q ? SearchX : Users}
          title={searchParams.q ? 'No matching customers' : 'No customers yet'}
          description={
            searchParams.q
              ? 'Try a different name, email, or phone number.'
              : 'Customer profiles will appear after account activity or an eligible order.'
          }
          action={searchParams.q ? { label: 'Clear search', href: '/studio/customers' } : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-white/10 text-smoke">
              <tr>
                <th className="p-3 font-normal">Name</th>
                <th className="p-3 font-normal">Email</th>
                <th className="p-3 font-normal">Phone</th>
                <th className="p-3 font-normal">Orders</th>
                <th className="p-3 font-normal">Total spending</th>
                <th className="p-3 font-normal">Wishlist</th>
                <th className="p-3 font-normal">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(
                (c: {
                  id: string;
                  name: string | null;
                  email: string;
                  phone: string | null;
                  totalSpending: unknown;
                  _count: { orders: number; wishlist: number; reviews: number };
                }) => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0">
                    <td className="p-3 text-parchment">{c.name ?? '—'}</td>
                    <td className="p-3 text-smoke">{c.email}</td>
                    <td className="p-3 text-smoke">{c.phone ?? '—'}</td>
                    <td className="p-3 text-smoke">{c._count.orders}</td>
                    <td className="p-3 text-smoke">
                      {formatPrice(Number((c.totalSpending as { toString: () => string }).toString()))}
                    </td>
                    <td className="p-3 text-smoke">{c._count.wishlist}</td>
                    <td className="p-3 text-smoke">{c._count.reviews}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
      <StudioPagination
        path="/studio/customers"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}
