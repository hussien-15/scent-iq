'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { ArrowLeft, Check, ImageIcon } from 'lucide-react';
import { createProduct, updateProduct, type ProductActionState } from '@/actions/product';
import ProductLifecycleActions from '@/components/studio/ProductLifecycleActions';

export type ProductEditorData = {
  id: string;
  nameEn: string; nameAr: string; slug: string; sku: string; barcode: string | null;
  brandId: string; categoryId: string | null; status: string;
  price: string; oldPrice: string | null; costPrice: string | null; currency: string;
  stock: number; reservedStock: number; lowStockThreshold: number; warehouseLocation: string | null;
  shortDescriptionEn: string | null; shortDescriptionAr: string | null;
  descriptionEn: string; descriptionAr: string; storyEn: string | null; storyAr: string | null;
  concentration: string | null; gender: string; bottleSize: string | null;
  releaseYear: number | null; countryOfOrigin: string | null; scentFamilies: string[];
  longevity: string | null; projection: string | null; sillage: string | null;
  season: string[]; occasion: string[]; style: string[]; mood: string[];
  metaTitleEn: string | null; metaTitleAr: string | null;
  metaDescriptionEn: string | null; metaDescriptionAr: string | null;
  keywords: string[]; searchAliases: string[]; ogImage: string | null; canonicalUrl: string | null;
  mainImageId: string | null; videoId: string | null;
  notes: Array<{ noteId: string; tier: string }>;
  tagIds: string[]; galleryMediaIds: string[];
};

type Props = {
  product?: ProductEditorData;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; nameEn: string }>;
  notes: Array<{ id: string; nameEn: string; nameAr: string }>;
  tags: Array<{ id: string; name: string; nameAr: string | null }>;
  media: Array<{ id: string; url: string; name: string | null; type: string }>;
  completion?: { percent: number; missing: string[] };
};

const inputClass = 'w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-parchment placeholder:text-smoke/60 focus:border-studioBlue/60 focus:outline-none';
const labelClass = 'mb-1.5 block text-xs text-smoke';
const initialState: ProductActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-md bg-gold px-5 py-2.5 text-xs font-medium text-ink hover:bg-gold-bright disabled:opacity-50">{pending ? 'Saving…' : 'Save product'}</button>;
}

function FieldError({ state, name }: { state: ProductActionState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <p className="mt-1 text-xs text-red-300">{message}</p> : null;
}

function Section({ title, description, children, open = false }: { title: string; description: string; children: React.ReactNode; open?: boolean }) {
  return <details open={open} className="rounded-lg border border-white/10 bg-white/[0.02]">
    <summary className="cursor-pointer list-none px-5 py-4"><h2 className="text-sm font-medium text-parchment">{title}</h2><p className="mt-1 text-xs text-smoke">{description}</p></summary>
    <div className="border-t border-white/10 p-5">{children}</div>
  </details>;
}

function Chips({ name, options, selected = [] }: { name: string; options: Array<{ value: string; label: string }>; selected?: string[] }) {
  return <div className="flex flex-wrap gap-2">{options.map((option) => <label key={option.value} className="cursor-pointer">
    <input className="peer sr-only" type="checkbox" name={name} value={option.value} defaultChecked={selected.includes(option.value)} />
    <span className="inline-flex rounded-full border border-white/10 px-3 py-1.5 text-xs text-smoke peer-checked:border-studioBlue/60 peer-checked:bg-studioBlue/10 peer-checked:text-studioBlue">{option.label}</span>
  </label>)}</div>;
}

const seasons = ['spring', 'summer', 'autumn', 'winter', 'all seasons'];
const occasions = ['daily', 'office', 'formal', 'date', 'wedding', 'travel', 'evening', 'casual'];
const styles = ['elegant', 'luxury', 'fresh', 'sweet', 'dark', 'modern', 'classic'];
const moods = ['confident', 'romantic', 'calm', 'bold', 'energetic', 'mysterious'];

export default function ProductForm({ product, brands, categories, notes, tags, media, completion }: Props) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useFormState(action, initialState);
  const [name, setName] = useState(product?.nameEn ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [mainImageId, setMainImageId] = useState(product?.mainImageId ?? '');

  function updateName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }

  return <form action={formAction} className="pb-24">
    <div className="sticky top-0 z-20 -mx-6 mb-6 flex items-center justify-between gap-3 border-b border-white/10 bg-ink/95 px-6 py-4 backdrop-blur">
      <div><Link href="/studio/products" className="mb-1 flex items-center gap-1 text-xs text-smoke hover:text-parchment"><ArrowLeft size={13} /> Back to products</Link><h1 className="font-display text-xl text-parchment sm:text-2xl">{product ? `Edit ${product.nameEn}` : 'Add product'}</h1></div>
      <SaveButton />
    </div>

    {state.error && <div className="mb-5 rounded-md border border-red-300/20 bg-red-300/10 px-4 py-3 text-xs text-red-200">{state.error}</div>}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <Section title="1. Basic information" description="Bilingual name, catalog identity, brand, category and publication status." open>
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className={labelClass}>Name (English) *</span><input name="nameEn" value={name} onChange={(e) => updateName(e.target.value)} className={inputClass} /><FieldError state={state} name="nameEn" /></label>
            <label><span className={labelClass}>الاسم بالعربي *</span><input name="nameAr" dir="rtl" defaultValue={product?.nameAr} className={inputClass} /><FieldError state={state} name="nameAr" /></label>
            <label><span className={labelClass}>Slug *</span><input name="slug" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} className={inputClass} /><FieldError state={state} name="slug" /></label>
            <label><span className={labelClass}>SKU *</span><input name="sku" defaultValue={product?.sku} className={inputClass} /><FieldError state={state} name="sku" /></label>
            <label><span className={labelClass}>Brand *</span><select name="brandId" defaultValue={product?.brandId ?? ''} className={inputClass}><option value="">Select brand</option>{brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><FieldError state={state} name="brandId" /></label>
            <label><span className={labelClass}>Category</span><select name="categoryId" defaultValue={product?.categoryId ?? ''} className={inputClass}><option value="">No category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.nameEn}</option>)}</select></label>
            <label><span className={labelClass}>Barcode</span><input name="barcode" defaultValue={product?.barcode ?? ''} className={inputClass} /></label>
            <label><span className={labelClass}>Status</span><select name="status" defaultValue={product?.status ?? 'DRAFT'} className={inputClass}>{['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'DISCONTINUED'].map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
        </Section>

        <Section title="2. Pricing & inventory" description="Server-validated prices and an audited initial stock movement.">
          <div className="grid gap-4 md:grid-cols-3">
            <label><span className={labelClass}>Selling price *</span><input type="number" min="0" step="0.01" name="price" defaultValue={product?.price ?? ''} className={inputClass} /><FieldError state={state} name="price" /></label>
            <label><span className={labelClass}>Old price</span><input type="number" min="0" step="0.01" name="oldPrice" defaultValue={product?.oldPrice ?? ''} className={inputClass} /></label>
            <label><span className={labelClass}>Cost price</span><input type="number" min="0" step="0.01" name="costPrice" defaultValue={product?.costPrice ?? ''} className={inputClass} /></label>
            <label><span className={labelClass}>Currency</span><select name="currency" defaultValue={product?.currency ?? 'IQD'} className={inputClass}><option>IQD</option><option>USD</option></select></label>
            {!product && <label><span className={labelClass}>Initial stock</span><input type="number" min="0" name="initialStock" defaultValue="0" className={inputClass} /></label>}
            {product && <input type="hidden" name="initialStock" value="0" />}
            <label><span className={labelClass}>Low-stock threshold</span><input type="number" min="0" name="lowStockThreshold" defaultValue={product?.lowStockThreshold ?? 5} className={inputClass} /></label>
            <label className="md:col-span-2"><span className={labelClass}>Warehouse location</span><input name="warehouseLocation" defaultValue={product?.warehouseLocation ?? ''} className={inputClass} /></label>
          </div>
          {product && <p className="mt-4 rounded-md border border-gold/20 bg-gold/5 p-3 text-xs text-smoke">Current stock: <span className="text-parchment">{product.stock}</span> ({product.reservedStock} reserved). Stock changes stay in the audited <Link className="text-gold-bright" href="/studio/inventory">Inventory Manager</Link>.</p>}
        </Section>

        <Section title="3. Descriptions" description="Short copy, factual detail and optional fragrance story in both languages.">
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className={labelClass}>Short description (EN)</span><textarea name="shortDescriptionEn" defaultValue={product?.shortDescriptionEn ?? ''} rows={3} className={inputClass} /></label>
            <label><span className={labelClass}>وصف مختصر</span><textarea name="shortDescriptionAr" dir="rtl" defaultValue={product?.shortDescriptionAr ?? ''} rows={3} className={inputClass} /></label>
            <label><span className={labelClass}>Description (EN) *</span><textarea name="descriptionEn" defaultValue={product?.descriptionEn ?? ''} rows={7} className={inputClass} /><FieldError state={state} name="descriptionEn" /></label>
            <label><span className={labelClass}>الوصف بالعربي *</span><textarea name="descriptionAr" dir="rtl" defaultValue={product?.descriptionAr ?? ''} rows={7} className={inputClass} /><FieldError state={state} name="descriptionAr" /></label>
            <label><span className={labelClass}>Story (EN)</span><textarea name="storyEn" defaultValue={product?.storyEn ?? ''} rows={5} className={inputClass} /></label>
            <label><span className={labelClass}>القصة</span><textarea name="storyAr" dir="rtl" defaultValue={product?.storyAr ?? ''} rows={5} className={inputClass} /></label>
          </div>
        </Section>

        <Section title="4. Fragrance profile" description="Classification, bottle details and structured note pyramid.">
          <div className="grid gap-4 md:grid-cols-3">
            <label><span className={labelClass}>Gender *</span><select name="gender" defaultValue={product?.gender ?? 'UNISEX'} className={inputClass}>{['MEN', 'WOMEN', 'MASCULINE', 'FEMININE', 'UNISEX'].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span className={labelClass}>Concentration</span><input name="concentration" placeholder="EDP" defaultValue={product?.concentration ?? ''} className={inputClass} /></label>
            <label><span className={labelClass}>Bottle size</span><input name="bottleSize" placeholder="100ml" defaultValue={product?.bottleSize ?? ''} className={inputClass} /></label>
            <label><span className={labelClass}>Release year</span><input type="number" min="1800" max="2100" name="releaseYear" defaultValue={product?.releaseYear ?? ''} className={inputClass} /></label>
            <label><span className={labelClass}>Country of origin</span><input name="countryOfOrigin" defaultValue={product?.countryOfOrigin ?? ''} className={inputClass} /></label>
            <label><span className={labelClass}>Scent families (comma separated)</span><input name="scentFamilies" defaultValue={product?.scentFamilies.join(', ')} className={inputClass} /></label>
          </div>
          {(['TOP', 'HEART', 'BASE'] as const).map((tier) => <div key={tier} className="mt-5"><p className="mb-2 text-xs text-parchment">{tier[0] + tier.slice(1).toLowerCase()} notes</p><Chips name={`${tier.toLowerCase()}NoteIds`} selected={product?.notes.filter((item) => item.tier === tier).map((item) => item.noteId)} options={notes.map((item) => ({ value: item.id, label: `${item.nameEn} · ${item.nameAr}` }))} /></div>)}
        </Section>

        <Section title="5. Performance & usage" description="Filterable signals used on product pages and rule-based recommendations.">
          <div className="grid gap-4 md:grid-cols-3">{(['longevity', 'projection', 'sillage'] as const).map((name) => <label key={name}><span className={labelClass}>{name[0].toUpperCase() + name.slice(1)}</span><select name={name} defaultValue={product?.[name] ?? ''} className={inputClass}><option value="">Not rated</option>{['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'].map((value) => <option key={value}>{value}</option>)}</select></label>)}</div>
          {[['season', seasons], ['occasion', occasions], ['style', styles], ['mood', moods]].map(([name, values]) => <div key={name as string} className="mt-5"><p className="mb-2 text-xs capitalize text-parchment">{name as string}</p><Chips name={name as string} selected={(product?.[name as keyof ProductEditorData] as string[] | undefined) ?? []} options={(values as string[]).map((value) => ({ value, label: value }))} /></div>)}
        </Section>

        <Section title="6. Media" description="Choose reusable assets already approved in the Media Library.">
          {media.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{media.map((item) => <label key={item.id} className="group relative cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
            <input className="peer sr-only" type="checkbox" name="galleryMediaIds" value={item.id} defaultChecked={product?.galleryMediaIds.includes(item.id)} />
            <div className="relative aspect-square bg-black/20">{item.type === 'IMAGE' || item.type === 'LOGO' || item.type === 'BANNER' ? <Image src={item.url} alt={item.name ?? 'Media'} fill sizes="180px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-smoke"><ImageIcon /></div>}</div>
            <span className="absolute end-2 top-2 hidden rounded-full bg-studioBlue p-1 text-ink peer-checked:block"><Check size={12} /></span>
            <span className="block truncate p-2 text-[10px] text-smoke">{item.name ?? item.id}</span>
            <button type="button" onClick={() => setMainImageId(item.id)} className={`m-2 mt-0 rounded px-2 py-1 text-[9px] ${mainImageId === item.id ? 'bg-gold text-ink' : 'border border-white/10 text-smoke'}`}>{mainImageId === item.id ? 'Main image' : 'Set main'}</button>
          </label>)}</div> : <p className="rounded-md border border-dashed border-white/10 p-5 text-center text-xs text-smoke">No media yet. <Link href="/studio/media" className="text-gold-bright">Upload assets in Media Library</Link>.</p>}
          <input type="hidden" name="mainImageId" value={mainImageId} />
          <label className="mt-4 block"><span className={labelClass}>Video asset</span><select name="videoId" defaultValue={product?.videoId ?? ''} className={inputClass}><option value="">No video</option>{media.filter((item) => item.type === 'VIDEO').map((item) => <option key={item.id} value={item.id}>{item.name ?? item.id}</option>)}</select></label>
        </Section>

        <Section title="7. Tags & discovery" description="Merchandising labels and alternate search phrases.">
          <p className="mb-2 text-xs text-parchment">Managed tags</p><Chips name="tagIds" selected={product?.tagIds} options={tags.map((item) => ({ value: item.id, label: item.nameAr ? `${item.name} · ${item.nameAr}` : item.name }))} />
          <div className="mt-4 grid gap-4 md:grid-cols-2"><label><span className={labelClass}>Search aliases (comma separated)</span><input name="searchAliases" defaultValue={product?.searchAliases.join(', ')} className={inputClass} /></label><label><span className={labelClass}>Keywords (comma separated)</span><input name="keywords" defaultValue={product?.keywords.join(', ')} className={inputClass} /></label></div>
        </Section>

        <Section title="8. SEO" description="Bilingual metadata, canonical URL and social image.">
          <div className="grid gap-4 md:grid-cols-2"><label><span className={labelClass}>Meta title (EN)</span><input name="metaTitleEn" defaultValue={product?.metaTitleEn ?? ''} className={inputClass} /></label><label><span className={labelClass}>عنوان SEO</span><input dir="rtl" name="metaTitleAr" defaultValue={product?.metaTitleAr ?? ''} className={inputClass} /></label><label><span className={labelClass}>Meta description (EN)</span><textarea name="metaDescriptionEn" defaultValue={product?.metaDescriptionEn ?? ''} rows={3} className={inputClass} /></label><label><span className={labelClass}>وصف SEO</span><textarea dir="rtl" name="metaDescriptionAr" defaultValue={product?.metaDescriptionAr ?? ''} rows={3} className={inputClass} /></label><label><span className={labelClass}>OG image URL</span><input name="ogImage" defaultValue={product?.ogImage ?? ''} className={inputClass} /></label><label><span className={labelClass}>Canonical URL</span><input name="canonicalUrl" defaultValue={product?.canonicalUrl ?? ''} className={inputClass} /></label></div>
        </Section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        {completion && <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4"><div className="flex items-center justify-between"><h2 className="text-xs font-medium text-parchment">Completion score</h2><span className={completion.percent === 100 ? 'text-xs text-emerald-300' : 'text-xs text-gold-bright'}>{completion.percent}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={completion.percent === 100 ? 'h-full bg-emerald-300' : 'h-full bg-gold'} style={{ width: `${completion.percent}%` }} /></div>{completion.missing.length > 0 ? <ul className="mt-3 space-y-1 text-[10px] text-smoke">{completion.missing.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-[10px] text-emerald-200">All publishing fields are complete.</p>}</div>}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4"><h2 className="text-xs font-medium text-parchment">Publishing checklist</h2><ul className="mt-3 space-y-2 text-[11px] text-smoke"><li>• Names, SKU, brand and prices are required.</li><li>• Both detailed descriptions are required.</li><li>• Publishing requires publish permission.</li><li>• Stock changes remain fully audited.</li><li>• Public prices and stock are always read server-side.</li></ul></div>
        {product && <ProductLifecycleActions productId={product.id} />}
      </aside>
    </div>
  </form>;
}
