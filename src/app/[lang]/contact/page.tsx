import InfoPage from '@/components/InfoPage';
import { getDictionary, type Locale } from '@/lib/i18n';

export default function ContactPage({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang);
  const channels = [
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP
      ? {
          label: params.lang === 'ar' ? 'دعم واتساب' : 'WhatsApp support',
          href: `https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP.replace(/\D/g, '')}`,
        }
      : null,
    process.env.NEXT_PUBLIC_SUPPORT_PHONE
      ? { label: process.env.NEXT_PUBLIC_SUPPORT_PHONE, href: `tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE}` }
      : null,
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL
      ? { label: process.env.NEXT_PUBLIC_SUPPORT_EMAIL, href: `mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}` }
      : null,
  ].filter((channel): channel is { label: string; href: string } => Boolean(channel));
  return (
    <InfoPage title={dict.info.contact.title} body={dict.info.contact.body}>
      <div className="mt-8 flex flex-wrap gap-3">
        {channels.map((channel) => (
          <a
            key={channel.href}
            href={channel.href}
            className="min-h-11 rounded-md border border-gold/30 px-4 py-3 text-xs text-gold"
          >
            {channel.label}
          </a>
        ))}
        {!channels.length && (
          <p className="rounded-md border border-white/10 p-4 text-xs leading-5 text-smoke">
            {params.lang === 'ar'
              ? 'قنوات الدعم قيد الإعداد قبل الإطلاق العام.'
              : 'Verified support channels are being configured before public launch.'}
          </p>
        )}
      </div>
    </InfoPage>
  );
}
