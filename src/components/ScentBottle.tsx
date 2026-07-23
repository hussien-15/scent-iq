/**
 * A minimal line-art bottle silhouette used in place of product photography
 * until real images are added. Deliberately one consistent gold treatment
 * across every product — restraint over color-coding, per the platform's
 * luxury-first principle.
 */
export default function ScentBottle({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gold/[0.06] ${className}`}>
      <svg
        viewBox="0 0 100 160"
        className="h-2/3 w-auto text-gold"
        fill="none"
        aria-hidden="true"
      >
        <rect x="30" y="52" width="40" height="88" rx="5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M40 52 L40 30 Q40 20 50 20 Q60 20 60 30 L60 52"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <rect x="41" y="7" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <line x1="30" y1="78" x2="70" y2="78" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      </svg>
    </div>
  );
}
