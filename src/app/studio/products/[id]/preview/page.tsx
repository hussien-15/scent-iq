import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Eye, PackageCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/utils/format-price';
import { getCompletionScore } from '@/services/product-completion.service';

export const dynamic = 'force-dynamic';

export default async function ProductPreviewPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const product = await prisma.perfume.findUnique({
    where: { id: params.id },
    include: {
      brand: true,
      category: true,
      mainImage: true,
      galleryMedia: { orderBy: { sortOrder: 'asc' }, include: { media: true } },
      notes: { orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }], include: { note: true } },
      tags: { include: { tag: true } },
    },
  });
  if (!product) notFound();
  const completion = getCompletionScore({ ...product, media: product.galleryMedia, notes: product.notes, tags: product.tags });
  const images = product.galleryMedia.map((item) => item.media);
  if (product.mainImage && !images.some((item) => item.id === product.mainImageId)) images.unshift(product.mainImage);
  const tierLabels = { TOP: 'المقدمة', HEART: 'القلب', BASE: 'القاعدة' } as const;

  return <div className="min-h-screen bg-ink text-parchment">
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-ink/95 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-3"><Link href={`/studio/products/${product.id}`} className="flex items-center gap-1 text-xs text-smoke hover:text-parchment"><ArrowLeft size={14} /> Back to editor</Link><span className="rounded-full border border-studioBlue/30 bg-studioBlue/10 px-3 py-1 text-[10px] text-studioBlue"><Eye size={11} className="me-1 inline" />Private preview · {product.status}</span></div>
      <div className="flex items-center gap-3 text-xs"><span className={completion.percent === 100 ? 'text-emerald-300' : 'text-gold-bright'}>{completion.percent}% complete</span><Link href={`/studio/products/${product.id}`} className="rounded-md bg-gold px-4 py-2 font-medium text-ink">Edit product</Link></div>
    </header>

    <main dir="rtl" lang="ar" className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-7 rounded-xl border border-gold/20 bg-gold/5 p-4 text-xs leading-6 text-smoke">هذه معاينة خاصة داخل Perfume Studio، لذلك يمكن عرض المسودة والمنتج المخفي بدون نشره للزبائن أو لمحركات البحث.</div>
      <div className="grid gap-10 md:grid-cols-2">
        <section>
          {images[0] ? <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-ink-soft"><Image src={images[0].url} alt={images[0].altTextAr ?? product.nameAr} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" unoptimized /></div> : <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-white/15 bg-ink-soft text-smoke"><PackageCheck size={36} /></div>}
          {images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">{images.slice(1, 6).map((image) => <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg border border-white/10"><Image src={image.url} alt={image.altTextAr ?? product.nameAr} fill sizes="120px" className="object-cover" unoptimized /></div>)}</div>}
        </section>

        <section>
          <p className="text-xs uppercase tracking-[0.18em] text-gold-bright">{product.brand.nameAr ?? product.brand.name}</p>
          <h1 className="mt-2 font-display text-4xl">{product.nameAr}</h1>
          <p className="mt-2 text-sm text-smoke">{product.nameEn} · {product.concentration ?? '—'} · {product.bottleSize ?? '—'}</p>
          <div className="mt-6 flex items-baseline gap-3">{product.oldPrice && Number(product.oldPrice) > Number(product.price) && <span className="text-sm text-smoke line-through">{formatPrice(product.oldPrice, product.currency)}</span>}<strong className="font-display text-3xl text-gold-bright">{formatPrice(product.price, product.currency)}</strong></div>
          <p className="mt-6 whitespace-pre-line text-sm leading-8 text-smoke">{product.descriptionAr}</p>
          <dl className="mt-7 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 p-3"><dt className="text-smoke">الفئة</dt><dd className="mt-1">{product.category?.nameAr ?? '—'}</dd></div>
            <div className="rounded-lg border border-white/10 p-3"><dt className="text-smoke">المتوفر</dt><dd className="mt-1">{product.availableStock}</dd></div>
            <div className="rounded-lg border border-white/10 p-3"><dt className="text-smoke">SKU</dt><dd dir="ltr" className="mt-1 text-end">{product.sku}</dd></div>
            <div className="rounded-lg border border-white/10 p-3"><dt className="text-smoke">الثبات</dt><dd className="mt-1">{product.longevity?.replaceAll('_', ' ') ?? '—'}</dd></div>
            <div className="rounded-lg border border-white/10 p-3"><dt className="text-smoke">الفوحان</dt><dd className="mt-1">{product.projection?.replaceAll('_', ' ') ?? '—'}</dd></div>
            <div className="rounded-lg border border-white/10 p-3"><dt className="text-smoke">الانتشار</dt><dd className="mt-1">{product.sillage?.replaceAll('_', ' ') ?? '—'}</dd></div>
          </dl>
        </section>
      </div>

      <section className="mt-12 rounded-2xl border border-white/10 bg-ink-soft p-6"><h2 className="font-display text-2xl">الهرم العطري</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{(['TOP', 'HEART', 'BASE'] as const).map((tier) => <div key={tier}><p className="text-xs text-gold-bright">{tierLabels[tier]}</p><p className="mt-2 text-sm leading-7 text-smoke">{product.notes.filter((item) => item.tier === tier).map((item) => item.note.nameAr).join('، ') || 'لم تُحدد النوتات'}</p></div>)}</div></section>
      {product.tags.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{product.tags.map((item) => <span key={item.tagId} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-smoke">{item.tag.nameAr ?? item.tag.name}</span>)}</div>}
    </main>
  </div>;
}
