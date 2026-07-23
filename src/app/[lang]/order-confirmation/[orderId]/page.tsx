import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Home, ShoppingBag } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/utils/format-price';
import { getDictionary, resolveLocale } from '@/lib/i18n';
import { verifyOrderConfirmationToken } from '@/lib/security';
import { localized } from '@/utils/localized';
import { buttonStyles } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage(
  props: {
    params: Promise<{ lang: string; orderId: string }>;
    searchParams: Promise<{ token?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const dict = getDictionary(params.lang);

  if (!searchParams.token || !verifyOrderConfirmationToken(params.orderId, searchParams.token)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      deliveryCompany: { select: { name: true, estimatedDays: true } },
      items: { include: { perfume: { select: { nameEn: true, nameAr: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <CheckCircle2 size={40} className="mx-auto mb-6 text-gold" strokeWidth={1.5} />
      <h1 className="mb-3 font-display text-3xl text-parchment">{dict.confirmation.title}</h1>
      <p className="mb-10 text-sm text-smoke">{dict.confirmation.message}</p>

      <div className="luxury-card space-y-3 p-6 text-start text-sm">
        <div className="flex justify-between">
          <span className="text-smoke">{dict.confirmation.orderNumber}</span>
          <span className="text-parchment">#{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-smoke">{dict.confirmation.customer}</span>
          <span className="text-end text-parchment">{order.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-smoke">{dict.confirmation.total}</span>
          <span className="text-gold-bright">{formatPrice(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-smoke">{dict.confirmation.deliveryTo}</span>
          <span className="text-parchment">
            {order.city}
            {order.area ? `, ${order.area}` : ''}
          </span>
        </div>
        {order.deliveryCompany?.estimatedDays && (
          <div className="flex justify-between">
            <span className="text-smoke">{dict.confirmation.estimatedDelivery}</span>
            <span className="text-parchment">{order.deliveryCompany.estimatedDays}</span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-smoke">{dict.confirmation.paymentMethod}</span>
          <span className="text-end text-parchment">{dict.confirmation.cashOnDelivery}</span>
        </div>
        <div className="border-t border-ink-line pt-4">
          <p className="mb-3 text-smoke">{dict.confirmation.products}</p>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4">
                <span className="text-parchment">
                  {item.productNameSnapshot || localized(params.lang, item.perfume.nameEn, item.perfume.nameAr)}{' '}
                  <small className="block text-[10px] text-smoke">
                    {dict.confirmation.quantity}: {item.quantity}
                  </small>
                </span>
                <span className="shrink-0 text-gold-bright">{formatPrice(item.subtotal, order.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={`/${params.lang}`} className={buttonStyles({ variant: 'secondary' })}>
          <Home size={15} />
          {dict.confirmation.returnHome}
        </Link>
        <Link href={`/${params.lang}/shop`} className={buttonStyles()}>
          <ShoppingBag size={15} />
          {dict.confirmation.continueShopping}
        </Link>
      </div>
    </div>
  );
}
