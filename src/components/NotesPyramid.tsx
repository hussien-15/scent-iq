/**
 * ScentIQ's recurring signature motif: three lines widening top to bottom,
 * echoing a fragrance pyramid (top / heart / base notes). Used as a quiet
 * section divider across the hero, footer, and between page sections.
 */
export default function NotesPyramid({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${className}`}
      role="separator"
      aria-hidden="true"
    >
      <div className="h-px w-6 bg-gold/60" />
      <div className="h-px w-12 bg-gold/40" />
      <div className="h-px w-24 bg-gold/20" />
    </div>
  );
}
