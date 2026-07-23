import type { ReactNode } from 'react';

/**
 * A single reusable fade/rise-in wrapper — used instead of scattering
 * animation props across every section that wants a soft entrance. This is a
 * server component backed by CSS, so the hero no longer ships an animation
 * runtime before the primary content can paint.
 */
export default function FadeIn({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <div className="motion-safe:animate-[scentiq-fade_600ms_ease-out_both]" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
