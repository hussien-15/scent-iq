import { BadgeCheck, Headphones, MessageCircle, PackageCheck, Phone, SearchCheck, ShieldCheck, Truck } from 'lucide-react';
import type ar from '@/dictionaries/ar';

export default function AuthenticityTrustSection({ dict }: { dict: typeof ar }) {
  const checks = [
    { icon: ShieldCheck, label: dict.product.trustSection.sourced },
    { icon: SearchCheck, label: dict.product.trustSection.checked },
    { icon: PackageCheck, label: dict.product.trustSection.packaging },
  ];
  const support = [
    { icon: MessageCircle, label: dict.product.trustSection.whatsapp },
    { icon: Phone, label: dict.product.trustSection.phone },
    { icon: BadgeCheck, label: dict.product.trustSection.confirmation },
    { icon: Truck, label: dict.product.trustSection.followup },
  ];

  return (
    <section className="mt-16 grid overflow-hidden rounded-sm border border-ink-line bg-ink-soft/35 md:grid-cols-2">
      <div className="p-7 md:p-10">
        <p className="eyebrow mb-3">{dict.product.trustSection.authenticityEyebrow}</p>
        <h2 className="max-w-lg font-display text-2xl text-parchment md:text-3xl">{dict.product.trustSection.authenticityTitle}</h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-smoke">{dict.product.trustSection.authenticityBody}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {checks.map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-2 text-xs text-parchment"><Icon size={16} className="shrink-0 text-gold" />{label}</div>)}
        </div>
      </div>
      <div className="border-t border-ink-line bg-gold/[0.04] p-7 md:border-s md:border-t-0 md:p-10">
        <Headphones size={24} className="text-gold" />
        <h3 className="mt-4 font-display text-2xl text-parchment">{dict.product.trustSection.supportTitle}</h3>
        <p className="mt-3 text-sm leading-7 text-smoke">{dict.product.trustSection.supportBody}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {support.map(({ icon: Icon, label }) => <span key={label} className="flex items-center gap-2 text-xs text-parchment"><Icon size={15} className="text-gold" />{label}</span>)}
        </div>
      </div>
    </section>
  );
}
