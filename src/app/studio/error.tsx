'use client';

import Link from 'next/link';

export default function StudioError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center text-center">
      <div className="rounded-xl border border-red-300/15 bg-white/[0.015] p-8">
        <p className="eyebrow mb-3">Perfume Studio</p>
        <h1 className="font-display text-3xl text-parchment">This screen could not be loaded</h1>
        <p className="mt-3 text-xs leading-6 text-smoke">
          Retry the safe read. If it continues, check System Health and the deployment logs using the current release
          identifier.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="rounded-md bg-gold px-5 py-2 text-xs font-medium text-ink">
            Try again
          </button>
          <Link
            href="/studio/system-health"
            className="rounded-md border border-gold/30 px-5 py-2 text-xs text-gold-bright"
          >
            System Health
          </Link>
        </div>
      </div>
    </div>
  );
}
