'use client';

import Image from 'next/image';
import { ChangeEvent, useRef, useState } from 'react';
import { FileImage, ImagePlus, Search, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

type MediaItem = {
  id: string;
  url: string;
  name: string | null;
  altText: string | null;
  type: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: string;
};

function fileSize(bytes: number | null) {
  if (!bytes) return 'Size unavailable';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export default function MediaLibraryManager({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const filtered = media.filter((item) =>
    `${item.name ?? ''} ${item.altText ?? ''} ${item.type}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('altText', altText);
      const response = await fetch('/api/studio/media/upload', { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? 'Upload failed.');
      const now = new Date().toISOString();
      setMedia((items) =>
        payload.data.duplicate
          ? items
          : [
              {
                id: payload.data.id,
                url: payload.data.url,
                name: file.name,
                altText: altText || null,
                type: 'IMAGE',
                width: payload.data.width,
                height: payload.data.height,
                sizeBytes: file.size,
                createdAt: now,
              },
              ...items,
            ]
      );
      setAltText('');
      showToast({
        message: payload.data.duplicate ? 'This image already exists in the library.' : 'Image uploaded successfully.',
        type: payload.data.duplicate ? 'info' : 'success',
      });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : 'Image upload failed. Try again.', type: 'error' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Approved visual assets</p>
          <h1 className="font-display text-3xl text-parchment">Media Library</h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-smoke">
            Upload optimized product and brand imagery, add useful alternative text, and reuse approved assets across
            ScentIQ.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Image description"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            maxLength={240}
            placeholder="Image description (recommended)"
            className="field-control min-w-64"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={upload}
            className="sr-only"
            id="media-upload"
          />
          <Button type="button" loading={uploading} onClick={() => inputRef.current?.click()}>
            <Upload size={15} />
            Upload image
          </Button>
        </div>
      </header>

      <div className="relative max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
        <input
          aria-label="Search media"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search media…"
          className="field-control pl-10"
        />
      </div>

      {media.length === 0 ? (
        <section className="luxury-card flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold">
            <ImagePlus size={24} />
          </span>
          <h2 className="mt-5 font-display text-2xl text-parchment">No media uploaded yet</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-smoke">
            Upload the first approved product image, logo, or campaign asset. JPG, PNG, WebP, and AVIF files up to 8 MB
            are supported.
          </p>
          <Button type="button" className="mt-6" loading={uploading} onClick={() => inputRef.current?.click()}>
            <Upload size={15} />
            Upload first image
          </Button>
        </section>
      ) : filtered.length === 0 ? (
        <section className="luxury-card flex flex-col items-center px-6 py-12 text-center">
          <FileImage size={28} className="text-gold" />
          <h2 className="mt-4 font-display text-xl">No matching media</h2>
          <p className="mt-2 text-sm text-smoke">Try a file name, description, or media type.</p>
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-colors hover:border-gold/35"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="relative block aspect-square bg-white/[0.03]"
              >
                <Image
                  src={item.url}
                  alt={item.altText || item.name || 'ScentIQ media'}
                  fill
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
                  className="object-contain p-2 transition-transform group-hover:scale-[1.02]"
                />
              </a>
              <div className="space-y-1 p-3">
                <p className="truncate text-xs text-parchment" title={item.name ?? undefined}>
                  {item.name ?? 'Untitled image'}
                </p>
                <p className="truncate text-[10px] text-smoke">{item.altText || 'Alternative text not added'}</p>
                <p className="text-[9px] uppercase tracking-wider text-smoke/70">
                  {item.type} · {fileSize(item.sizeBytes)}
                  {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
