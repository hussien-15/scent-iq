import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import OrderStatusControl from '@/components/studio/OrderStatusControl';
import OrderInternalNotes from '@/components/studio/OrderInternalNotes';
import ReviewRequestControl from '@/components/studio/ReviewRequestControl';

export const dynamic = 'force-dynamic';

export default async function StudioOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { perfume: { select: { nameEn: true, slug: true } }, variant: { select: { name: true, sku: true } } } },
      deliveryCompany: true,
      statusHistory: { orderBy: { createdAt: 'desc' }, include: { admin: { select: { name: true } } } },
      user: { select: { email: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <Link href="/studio/orders" className="flex items-center gap-1 text-xs text-smoke hover:text-parchment">
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-parchment">
          Order #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
        </h1>
        <div className="text-end"><OrderStatusControl orderId={order.id} currentStatus={order.status} /><p className="mt-2 text-[10px] text-smoke">Inventory: {order.inventoryState}</p></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 p-5">
          <p className="mb-3 text-xs text-smoke">Customer</p>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between"><dt className="text-smoke">Name</dt><dd className="text-parchment">{order.customerName}</dd></div>
            <div className="flex justify-between"><dt className="text-smoke">Phone</dt><dd className="text-parchment">{order.phone}</dd></div>
            {order.alternativePhone && (
              <div className="flex justify-between"><dt className="text-smoke">Alt. phone</dt><dd className="text-parchment">{order.alternativePhone}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-smoke">City</dt><dd className="text-parchment">{order.city}</dd></div>
            {order.area && <div className="flex justify-between"><dt className="text-smoke">Area</dt><dd className="text-parchment">{order.area}</dd></div>}
            <div className="flex justify-between"><dt className="text-smoke">Address</dt><dd className="text-parchment">{order.address}</dd></div>
            {order.landmark && <div className="flex justify-between"><dt className="text-smoke">Landmark</dt><dd className="text-parchment">{order.landmark}</dd></div>}
            {order.user?.email && <div className="flex justify-between"><dt className="text-smoke">Account</dt><dd className="text-parchment">{order.user.email}</dd></div>}
          </dl>
        </div>

        <div className="rounded-lg border border-white/10 p-5">
          <p className="mb-3 text-xs text-smoke">Delivery &amp; payment</p>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between"><dt className="text-smoke">Company</dt><dd className="text-parchment">{order.deliveryCompany?.name ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-smoke">Payment method</dt><dd className="text-parchment">Cash on delivery</dd></div>
            <div className="flex justify-between"><dt className="text-smoke">Subtotal</dt><dd className="text-parchment">${order.subtotal.toString()}</dd></div>
            <div className="flex justify-between"><dt className="text-smoke">Delivery fee</dt><dd className="text-parchment">${order.deliveryFee.toString()}</dd></div>
            <div className="flex justify-between"><dt className="text-smoke">Total</dt><dd className="text-gold-bright">${order.total.toString()}</dd></div>
          </dl>
          {order.deliveryNotes && (
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-smoke">
              Delivery note: {order.deliveryNotes}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 p-5">
        <p className="mb-3 text-xs text-smoke">Items</p>
        <table className="w-full text-start text-xs">
          <thead className="border-b border-white/10 text-smoke">
            <tr>
              <th className="p-2 font-normal">Product</th>
              <th className="p-2 font-normal">Qty</th>
              <th className="p-2 font-normal">Price</th>
              <th className="p-2 font-normal">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(
              (item: {
                id: string;
                quantity: number;
                price: { toString: () => string };
                subtotal: { toString: () => string };
                productNameSnapshot: string | null;
                brandNameSnapshot: string | null;
                skuSnapshot: string | null;
                perfume: { nameEn: string; slug: string };
                variant: { name: string; sku: string } | null;
              }) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0">
                  <td className="p-2 text-parchment">{item.productNameSnapshot ?? item.perfume.nameEn}<span className="block text-[10px] text-smoke">{item.brandNameSnapshot}</span>{item.variant ? <span className="block text-[10px] text-gold-bright">{item.variant.name} · {item.skuSnapshot ?? item.variant.sku}</span> : null}</td>
                  <td className="p-2 text-smoke">{item.quantity}</td>
                  <td className="p-2 text-smoke">${item.price.toString()}</td>
                  <td className="p-2 text-smoke">${item.subtotal.toString()}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-white/10 p-5">
        <ReviewRequestControl
          orderId={order.id}
          delivered={order.status === 'DELIVERED'}
          markedAt={order.reviewRequestMarkedAt?.toISOString() ?? null}
          products={order.items.map((item) => ({ name: item.perfume.nameEn, slug: item.perfume.slug }))}
        />
      </div>

      <div className="rounded-lg border border-white/10 p-5">
        <p className="mb-3 text-xs text-smoke">Internal notes (never shown to the customer)</p>
        <OrderInternalNotes orderId={order.id} initialNote={order.internalNotes ?? ''} />
      </div>

      <div className="rounded-lg border border-white/10 p-5">
        <p className="mb-3 text-xs text-smoke">Status history</p>
        <ul className="space-y-2 text-xs">
          {order.statusHistory.map(
            (h: {
              id: string;
              previousStatus: string | null;
              newStatus: string;
              note: string | null;
              createdAt: Date;
              admin: { name: string | null } | null;
            }) => (
              <li key={h.id} className="flex justify-between text-smoke">
                <span>
                  {h.previousStatus ? `${h.previousStatus} → ${h.newStatus}` : h.newStatus}
                  {h.admin?.name && ` · ${h.admin.name}`}
                  {h.note && ` · "${h.note}"`}
                </span>
                <span>{new Date(h.createdAt).toLocaleString()}</span>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}
