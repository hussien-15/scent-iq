'use client';

import './globals.css';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-ink px-6 text-parchment">
        <main className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 font-display text-2xl text-gold">
            S
          </div>
          <h1 className="font-display text-4xl">ScentIQ needs a moment</h1>
          <p className="mt-4 text-sm leading-7 text-smoke">
            The page could not be completed safely. Please retry; no order should be resubmitted from this screen.
          </p>
          <button onClick={reset} className="mt-7 rounded-full bg-gold px-6 py-3 text-xs font-medium text-ink">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
