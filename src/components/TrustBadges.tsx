import { BadgeCheck, Headphones, ShieldCheck, PackageCheck, Wallet, Truck, Lock } from 'lucide-react';
import type ar from '@/dictionaries/ar';

export default function TrustBadges({ dict }: { dict: typeof ar }) {
  const badges = [
    { icon: ShieldCheck, label: dict.product.trust.authentic },
    { icon: PackageCheck, label: dict.product.trust.packaging },
    { icon: Wallet, label: dict.product.trust.cod },
    { icon: Truck, label: dict.product.trust.delivery },
    { icon: Lock, label: dict.product.trust.secure },
    { icon: BadgeCheck, label: dict.product.trust.reviews },
    { icon: Headphones, label: dict.product.trust.support },
  ];

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3 border-y border-ink-line py-5">
      {badges.map(({ icon: Icon, label }) => (
        <span key={label} className="flex items-center gap-1.5 text-xs text-smoke">
          <Icon size={14} className="text-gold" strokeWidth={1.5} />
          {label}
        </span>
      ))}
    </div>
  );
}
