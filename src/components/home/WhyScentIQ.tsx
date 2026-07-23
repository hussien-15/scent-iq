import { ShieldCheck, Gem, Truck, Sparkles, Brain, Heart } from 'lucide-react';
import type ar from '@/dictionaries/ar';

export default function WhyScentIQ({ dict }: { dict: typeof ar }) {
  const points = [
    { icon: ShieldCheck, title: dict.home.why.authenticityTitle, desc: dict.home.why.authenticityDesc },
    { icon: Gem, title: dict.home.why.qualityTitle, desc: dict.home.why.qualityDesc },
    { icon: Truck, title: dict.home.why.deliveryTitle, desc: dict.home.why.deliveryDesc },
    { icon: Sparkles, title: dict.home.why.curationTitle, desc: dict.home.why.curationDesc },
    { icon: Brain, title: dict.home.why.recommendationsTitle, desc: dict.home.why.recommendationsDesc },
    { icon: Heart, title: dict.home.why.experienceTitle, desc: dict.home.why.experienceDesc },
  ];

  return (
    <section className="content-auto border-t border-ink-line px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow mb-2 text-center">{dict.home.why.eyebrow}</p>
        <h2 className="mb-10 text-center font-display text-2xl text-parchment md:text-3xl">
          {dict.home.why.title}
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {points.map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <Icon size={20} className="mb-3 text-gold" strokeWidth={1.5} />
              <h3 className="font-display text-base text-parchment">{title}</h3>
              <p className="mt-1 text-sm text-smoke">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
