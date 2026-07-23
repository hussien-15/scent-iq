const LEVELS = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'] as const;
type Level = (typeof LEVELS)[number];

export default function PerformanceBar({
  label,
  value,
  description,
}: {
  label: string;
  value: Level;
  description?: string;
}) {
  const filled = LEVELS.indexOf(value) + 1;

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-xs uppercase tracking-widest2 text-parchment">{label}</span>
        {description && <span className="mt-1 block text-[11px] leading-5 text-smoke">{description}</span>}
      </span>
      <div className="flex gap-1" aria-hidden="true">
        {LEVELS.map((level, i) => (
          <span key={level} className={`h-1.5 w-6 rounded-full ${i < filled ? 'bg-gold' : 'bg-ink-line'}`} />
        ))}
      </div>
    </div>
  );
}
