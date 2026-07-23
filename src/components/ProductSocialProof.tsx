import { Flame, Heart, MapPin, Snowflake } from 'lucide-react';
import type ar from '@/dictionaries/ar';

export default function ProductSocialProof({
  loved,
  baghdad,
  wishlisted,
  winter,
  dict,
}: {
  loved: boolean;
  baghdad: boolean;
  wishlisted: boolean;
  winter: boolean;
  dict: typeof ar;
}) {
  const items = [
    loved ? { icon: Flame, label: dict.product.socialProof.loved } : null,
    baghdad ? { icon: MapPin, label: dict.product.socialProof.baghdad } : null,
    wishlisted ? { icon: Heart, label: dict.product.socialProof.wishlisted } : null,
    winter ? { icon: Snowflake, label: dict.product.socialProof.winter } : null,
  ].filter(Boolean) as { icon: typeof Flame; label: string }[];
  if (items.length === 0) return null;

  return <div className="mt-6 flex flex-wrap gap-2">{items.map(({ icon: Icon, label }) => <span key={label} className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5 text-[11px] text-gold-bright"><Icon size={12} />{label}</span>)}</div>;
}
