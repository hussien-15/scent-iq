'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import type ar from '@/dictionaries/ar';

export default function ShareButtons({ title, dict }: { title: string; dict: typeof ar }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, letter: 'W' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, letter: 'F' },
    { name: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, letter: 'X' },
    { name: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, letter: 'T' },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — fail quietly.
    }
  }

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-line text-xs text-smoke hover:border-gold/40 hover:text-parchment transition-colors"
        >
          {link.letter}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label={dict.product.share.copyLink}
        title={copied ? dict.product.share.linkCopied : dict.product.share.copyLink}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-line text-smoke hover:border-gold/40 hover:text-parchment transition-colors"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
      </button>
    </div>
  );
}
