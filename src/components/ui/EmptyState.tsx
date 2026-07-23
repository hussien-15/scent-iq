import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { buttonStyles } from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  compact?: boolean;
}) {
  return (
    <section
      aria-labelledby={`empty-${title.replace(/\s+/g, '-').toLowerCase()}`}
      className={`mx-auto flex w-full max-w-2xl flex-col items-center rounded-2xl border border-ink-line bg-gradient-to-b from-ink-soft/80 to-ink/30 px-6 text-center ${compact ? 'py-8' : 'py-12 sm:py-16'}`}
    >
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold-bright">
        <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2
        id={`empty-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="font-display text-2xl text-parchment sm:text-3xl"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-7 text-smoke">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {action && (
            <Link href={action.href} className={buttonStyles({ size: 'sm' })}>
              {action.label}
            </Link>
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
