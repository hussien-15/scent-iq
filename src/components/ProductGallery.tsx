'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Three illustrated "views" stand in for real product photography (there's
 * no photo shoot to draw from yet — see the chat response). The gallery
 * interaction pattern itself — thumbnails, hover zoom, active state — is
 * real and ready to swap in actual images later without touching this
 * component's logic.
 */
const VIEWS = ['front', 'cap', 'label'] as const;
type View = (typeof VIEWS)[number];

function BottleIllustration({ view }: { view: View }) {
  return (
    <svg viewBox="0 0 200 320" className="h-full w-full text-gold" fill="none" aria-hidden="true">
      {view === 'front' && (
        <>
          <rect x="60" y="104" width="80" height="176" rx="10" stroke="currentColor" strokeWidth="1.6" />
          <path d="M80 104 L80 60 Q80 40 100 40 Q120 40 120 60 L120 104" stroke="currentColor" strokeWidth="1.6" />
          <rect x="82" y="14" width="36" height="30" rx="4" stroke="currentColor" strokeWidth="1.6" />
          <line x1="60" y1="156" x2="140" y2="156" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        </>
      )}
      {view === 'cap' && (
        <>
          <rect x="70" y="70" width="60" height="60" rx="6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M85 130 L85 160" stroke="currentColor" strokeWidth="1.6" />
          <path d="M115 130 L115 160" stroke="currentColor" strokeWidth="1.6" />
          <line x1="70" y1="100" x2="130" y2="100" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        </>
      )}
      {view === 'label' && (
        <>
          <rect x="60" y="104" width="80" height="176" rx="10" stroke="currentColor" strokeWidth="1.6" />
          <rect x="70" y="150" width="60" height="40" rx="2" stroke="currentColor" strokeWidth="1.2" opacity="0.9" />
          <line x1="78" y1="164" x2="122" y2="164" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="78" y1="174" x2="110" y2="174" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

export default function ProductGallery({ images = [], productName = 'Perfume' }: { images?: { url: string; altText: string | null }[]; productName?: string }) {
  const [active, setActive] = useState<View>('front');
  const [activeImage, setActiveImage] = useState(0);

  if (images.length > 0) {
    const selected = images[Math.min(activeImage, images.length - 1)];
    return (
      <div>
        <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-gold/[0.04]">
          <Image src={selected.url} alt={selected.altText || productName} fill priority={activeImage === 0} quality={82} sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1280px) 50vw, 576px" className="object-contain p-4 transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" />
        </div>
        {images.length > 1 && <div className="scrollbar-subtle mt-3 flex gap-3 overflow-x-auto pb-1">{images.map((image, index) => <button key={`${image.url}-${index}`} type="button" onClick={() => setActiveImage(index)} aria-label={`${productName} image ${index + 1}`} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border bg-white/[0.03] ${activeImage === index ? 'border-gold' : 'border-ink-line'}`}><Image src={image.url} alt={image.altText || `${productName} ${index + 1}`} fill quality={65} sizes="64px" className="object-cover" /></button>)}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="group aspect-[4/5] w-full overflow-hidden rounded-sm bg-gold/[0.06]">
        <div className="flex h-full w-full items-center justify-center transition-transform duration-500 ease-out group-hover:scale-110">
          <div className="h-2/3 w-2/3">
            <BottleIllustration view={active} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-3">
        {VIEWS.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActive(view)}
            aria-label={view}
            className={`flex h-16 w-16 items-center justify-center rounded-sm border bg-gold/[0.04] transition-colors ${
              active === view ? 'border-gold' : 'border-ink-line hover:border-gold/40'
            }`}
          >
            <div className="h-10 w-10">
              <BottleIllustration view={view} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
