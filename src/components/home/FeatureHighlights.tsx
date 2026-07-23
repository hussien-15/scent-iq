import { ShieldCheck, Wallet, Truck, Sparkles } from 'lucide-react';
import type ar from '@/dictionaries/ar';

export default function FeatureHighlights({ dict }: { dict: typeof ar }) {
  const features = [
    { icon: ShieldCheck, title: dict.home.features.authenticTitle, desc: dict.home.features.authenticDesc },
    { icon: Wallet, title: dict.home.features.codTitle, desc: dict.home.features.codDesc },
    { icon: Truck, title: dict.home.features.deliveryTitle, desc: dict.home.features.deliveryDesc },
    { icon: Sparkles, title: dict.home.features.smartTitle, desc: dict.home.features.smartDesc },
  ];

  return (
    <section className="border-t border-ink-line px-6 py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center">
            <Icon size={22} className="mx-auto mb-3 text-gold" strokeWidth={1.5} />
            <h3 className="font-display text-base text-parchment">{title}</h3>
            <p className="mt-1 text-xs text-smoke">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
