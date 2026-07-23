import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import StudioPagination from '@/components/studio/StudioPagination';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { SearchX, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/utils/format-price';

export const dynamic = 'force-dynamic';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'] as const;

function orderDate(date: Date) {
  return new Intl.DateTimeFormat('en-IQ', {
    timeZone: 'Asia/Baghdad',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function StudioOrdersPage(
  props: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const status = ORDER_STATUSES.includes(searchParams.status as (typeof ORDER_STATUSES)[number])
    ? (searchParams.status as (typeof ORDER_STATUSES)[number])
    : undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(searchParams.q
      ? {
          OR: [
            { customerName: { contains: searchParams.q, mode: 'insensitive' as const } },
            { phone: { contains: searchParams.q } },
            { city: { contains: searchParams.q, mode: 'insensitive' as const } },
            { orderNumber: { contains: searchParams.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const pageSize = 25;
  const requestedPage = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1);
  const total = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      city: true,
      total: true,
      status: true,
      createdAt: true,
      deliveryCompany: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-parchment">Orders</h1>

      <form className="grid max-w-2xl gap-3 sm:grid-cols-[1fr_180px_auto]">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Customer, phone, or city…"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-parchment placeholder:text-smoke"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink">Filter</button>
      </form>

      {orders.length === 0 ? (
        <EmptyState
          icon={searchParams.q || status ? SearchX : ShoppingBag}
          title={searchParams.q || status ? 'No matching orders' : 'No orders yet'}
          description={
            searchParams.q || status
              ? 'Try a different customer, phone, order number, city, or status.'
              : 'New customer orders will appear here as soon as checkout is completed.'
          }
          action={searchParams.q || status ? { label: 'Clear filters', href: '/studio/orders' } : undefined}
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {orders.map((o) => (
              <article key={o.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-gold-bright">#{o.orderNumber ?? o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-sm text-parchment">{o.customerName}</p>
                    <p className="mt-1 text-xs text-smoke">
                      {o.city} · {o.deliveryCompany?.name ?? 'Delivery unassigned'}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-smoke">{orderDate(o.createdAt)}</span>
                  <span className="font-display text-gold-bright">{formatPrice(Number(o.total.toString()))}</span>
                </div>
                <Link
                  href={`/studio/orders/${o.id}`}
                  className="mt-4 flex min-h-10 items-center justify-center rounded-full border border-studioBlue/30 text-xs text-studioBlue"
                >
                  View order
                </Link>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-lg border border-white/10 md:block">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-white/10 text-smoke">
                <tr>
                  <th className="p-3 font-normal">Customer</th>
                  <th className="p-3 font-normal">City</th>
                  <th className="p-3 font-normal">Delivery</th>
                  <th className="p-3 font-normal">Total</th>
                  <th className="p-3 font-normal">Status</th>
                  <th className="p-3 font-normal">Date</th>
                  <th className="p-3 font-normal" />
                </tr>
              </thead>
              <tbody>
                {orders.map(
                  (o: {
                    id: string;
                    orderNumber: string | null;
                    customerName: string;
                    city: string;
                    total: unknown;
                    status: string;
                    createdAt: Date;
                    deliveryCompany: { name: string } | null;
                  }) => (
                    <tr key={o.id} className="border-b border-white/5 last:border-0">
                      <td className="p-3 text-parchment">
                        <span className="block text-[9px] text-gold-bright">
                          #{o.orderNumber ?? o.id.slice(0, 8).toUpperCase()}
                        </span>
                        {o.customerName}
                      </td>
                      <td className="p-3 text-smoke">{o.city}</td>
                      <td className="p-3 text-smoke">{o.deliveryCompany?.name ?? '—'}</td>
                      <td className="p-3 text-smoke">
                        {formatPrice(Number((o.total as { toString: () => string }).toString()))}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="p-3 text-smoke">{orderDate(o.createdAt)}</td>
                      <td className="p-3">
                        <Link href={`/studio/orders/${o.id}`} className="text-studioBlue hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      <StudioPagination
        path="/studio/orders"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}
