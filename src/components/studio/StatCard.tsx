import type { LucideIcon } from 'lucide-react';

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-smoke">{label}</span>
        <Icon size={15} className={accent ? 'text-gold' : 'text-studioBlue'} strokeWidth={1.75} />
      </div>
      <p className="font-display text-2xl text-parchment">{value}</p>
    </div>
  );
}
