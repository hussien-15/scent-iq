'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore, cartSubtotal } from '@/lib/store/cart-store';
import { formatPrice } from '@/utils/format-price';
import { localized } from '@/utils/localized';
import { createOrder } from '@/actions/order';
import { getDictionary, type Locale } from '@/lib/i18n';
import TrustBadges from '@/components/TrustBadges';
import { getAnalyticsSessionId, trackAnalyticsEvent } from '@/lib/analytics-client';
import EmptyState from '@/components/ui/EmptyState';
import { ShoppingBag } from 'lucide-react';

const checkoutFormSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?964|0)7[3-9][0-9\s()-]{8,12}$/),
  alternativePhone: z.string().optional(),
  city: z.string().min(1),
  area: z.string().optional(),
  address: z.string().trim().min(5).max(500),
  landmark: z.string().optional(),
  deliveryNotes: z.string().optional(),
  deliveryCompanyId: z.string().min(1),
});
type CheckoutForm = z.infer<typeof checkoutFormSchema>;

type DeliveryOption = { id: string; name: string; estimatedDays: string | null; fee: number };

const CITIES = ['Baghdad', 'Basra', 'Erbil', 'Najaf', 'Mosul', 'Sulaymaniyah'];

export default function CheckoutPage({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  const router = useRouter();
  const { items } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submissionId = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    trackAnalyticsEvent({ event: 'CHECKOUT_STARTED' });
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutFormSchema) });

  const city = watch('city');
  const selectedDeliveryId = watch('deliveryCompanyId');

  useEffect(() => {
    if (!city) {
      setDeliveryOptions([]);
      setDeliveryLoading(false);
      setDeliveryError(false);
      return;
    }
    const controller = new AbortController();
    setDeliveryLoading(true);
    setDeliveryError(false);
    fetch(`/api/delivery-options?city=${encodeURIComponent(city)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('delivery');
        return res.json();
      })
      .then((data) => setDeliveryOptions(data.success ? data.data.options : []))
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setDeliveryOptions([]);
        setDeliveryError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDeliveryLoading(false);
      });
    return () => controller.abort();
  }, [city]);

  const subtotal = cartSubtotal(items);
  const selectedOption = deliveryOptions.find((o) => o.id === selectedDeliveryId);
  const deliveryFee = selectedOption?.fee ?? 0;
  const total = subtotal + deliveryFee;

  async function onSubmit(values: CheckoutForm) {
    setSubmitError('');
    submissionId.current ??= crypto.randomUUID();
    const result = await createOrder({
      ...values,
      items: items.map((i) => ({
        perfumeId: i.perfumeId,
        variantId: i.variantId,
        quantity: i.quantity,
        collectionId: i.sourceCollectionId,
      })),
      analyticsSessionId: getAnalyticsSessionId(),
      submissionId: submissionId.current,
    });

    if (result.success) {
      useCartStore.getState().clear();
      router.push(
        `/${params.lang}/order-confirmation/${result.orderId}?token=${encodeURIComponent(result.confirmationToken)}`
      );
    } else {
      setSubmitError(
        result.error === 'ordering_disabled' ? dict.checkout.errors.orderingDisabled : dict.checkout.errors.generic
      );
    }
  }

  if (!mounted)
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="h-10 w-56 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-sm bg-white/[0.04]" />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-sm border border-ink-line bg-white/[0.03]" />
        </div>
      </div>
    );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <EmptyState
          icon={ShoppingBag}
          title={dict.ui.empty.cartTitle}
          description={dict.ui.empty.cartDescription}
          action={{ label: dict.ui.empty.cartAction, href: `/${params.lang}/shop` }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 pb-32 sm:px-6 sm:py-16 md:pb-16">
      <h1 className="mb-10 font-display text-3xl text-parchment">{dict.checkout.title}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <p className="eyebrow">{dict.checkout.contactInfo}</p>

          <div>
            <input
              {...register('customerName')}
              aria-label={dict.checkout.name}
              placeholder={dict.checkout.name}
              className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
            />
            {errors.customerName && (
              <p className="mt-1 text-xs text-gold-bright">{dict.checkout.errors.nameRequired}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <input
                {...register('phone')}
                aria-label={dict.checkout.phone}
                type="tel"
                placeholder={dict.checkout.phone}
                className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
              />
              {errors.phone && <p className="mt-1 text-xs text-gold-bright">{dict.checkout.errors.phoneInvalid}</p>}
            </div>
            <input
              {...register('alternativePhone')}
              aria-label={dict.checkout.altPhone}
              type="tel"
              placeholder={dict.checkout.altPhone}
              className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <select
                {...register('city')}
                defaultValue=""
                className="w-full rounded-sm border border-ink-line bg-ink px-4 py-3 text-parchment focus:border-gold/50 focus:outline-none"
              >
                <option value="" disabled>
                  {dict.checkout.city}
                </option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.city && <p className="mt-1 text-xs text-gold-bright">{dict.checkout.errors.cityRequired}</p>}
            </div>
            <input
              {...register('area')}
              aria-label={dict.checkout.area}
              placeholder={dict.checkout.area}
              className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
            />
          </div>

          <div>
            <input
              {...register('address')}
              aria-label={dict.checkout.address}
              placeholder={dict.checkout.address}
              className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
            />
            {errors.address && <p className="mt-1 text-xs text-gold-bright">{dict.checkout.errors.addressRequired}</p>}
          </div>

          <input
            {...register('landmark')}
            aria-label={dict.checkout.landmark}
            placeholder={dict.checkout.landmark}
            className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
          />

          <textarea
            {...register('deliveryNotes')}
            aria-label={dict.checkout.notes}
            placeholder={dict.checkout.notes}
            rows={2}
            className="w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
          />

          <div>
            <p className="eyebrow mb-2 mt-6">{dict.checkout.deliveryCompany}</p>
            {!city ? (
              <p className="text-xs text-smoke">{dict.checkout.selectCity}</p>
            ) : deliveryLoading ? (
              <div className="space-y-2" aria-live="polite">
                <div className="h-12 animate-pulse rounded-sm bg-white/[0.04]" />
                <div className="h-12 animate-pulse rounded-sm bg-white/[0.04]" />
              </div>
            ) : deliveryError ? (
              <p className="rounded-sm border border-gold/20 bg-gold/5 p-3 text-xs text-smoke">
                {params.lang === 'ar'
                  ? 'تعذّر تحميل خيارات التوصيل. غيّر المدينة ثم اخترها مرة ثانية.'
                  : 'Delivery options could not load. Change the city and select it again.'}
              </p>
            ) : deliveryOptions.length === 0 ? (
              <p className="text-xs text-smoke">{dict.checkout.noDelivery}</p>
            ) : (
              <div className="space-y-2">
                {deliveryOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center justify-between rounded-sm border px-4 py-3 text-sm ${
                      selectedDeliveryId === opt.id ? 'border-gold' : 'border-ink-line'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-parchment">
                      <input
                        type="radio"
                        value={opt.id}
                        checked={selectedDeliveryId === opt.id}
                        onChange={() => setValue('deliveryCompanyId', opt.id)}
                        className="accent-gold"
                      />
                      {opt.name}
                      {opt.estimatedDays && <span className="text-xs text-smoke">({opt.estimatedDays})</span>}
                    </span>
                    <span className="text-gold-bright">{formatPrice(opt.fee)}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.deliveryCompanyId && (
              <p className="mt-1 text-xs text-gold-bright">{dict.checkout.errors.deliveryRequired}</p>
            )}
          </div>
        </div>

        <div className="hairline h-fit rounded-sm p-6">
          <p className="eyebrow mb-4">{dict.checkout.orderSummary}</p>
          <div className="mb-4 space-y-2 border-b border-ink-line pb-4 text-sm">
            {items.map((item) => (
              <div key={`${item.perfumeId}:${item.variantId ?? 'base'}`} className="flex justify-between text-smoke">
                <span>
                  {localized(params.lang, item.nameEn, item.nameAr)}
                  {item.variantName ? ` · ${item.variantName}` : ''} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-smoke">
              <span>{dict.checkout.subtotal}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-smoke">
              <span>{dict.checkout.deliveryFee}</span>
              <span>{deliveryFee === 0 && selectedOption ? dict.checkout.free : formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-ink-line pt-2 font-display text-base text-gold-bright">
              <span>{dict.checkout.total}</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-smoke">{dict.checkout.codNotice}</p>
          <div className="mt-5">
            <TrustBadges dict={dict} />
          </div>

          {submitError && <p className="mt-3 text-xs text-gold-bright">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 hidden w-full rounded-full bg-gold py-3 font-body text-sm font-medium text-ink transition-colors hover:bg-gold-bright disabled:opacity-60 md:block"
          >
            {isSubmitting ? dict.checkout.placingOrder : dict.checkout.confirmOrder}
          </button>
        </div>

        {/* Sticky mobile confirm bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-line bg-ink/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur md:hidden">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gold py-3 font-body text-sm font-medium text-ink transition-colors hover:bg-gold-bright disabled:opacity-60"
          >
            {isSubmitting ? dict.checkout.placingOrder : `${dict.checkout.confirmOrder} · ${formatPrice(total)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
