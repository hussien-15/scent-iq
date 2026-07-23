'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { archiveBrand, archiveCategory, createBrand, createCategory, updateBrand, updateCategory, type CatalogActionState } from '@/actions/catalog';

const inputClass = 'w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-parchment focus:border-studioBlue/60 focus:outline-none';
const initial: CatalogActionState = {};

function Submit({ label = 'Save' }: { label?: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink disabled:opacity-50">{pending ? 'Saving…' : label}</button>;
}

function Message({ state }: { state: CatalogActionState }) {
  if (state.error) return <p className="rounded-md bg-red-300/10 p-2 text-xs text-red-200">{state.error}</p>;
  if (state.success) return <p className="rounded-md bg-emerald-300/10 p-2 text-xs text-emerald-200">{state.success}</p>;
  return null;
}

function useSlug(initialName: string, initialSlug: string) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [touched, setTouched] = useState(Boolean(initialSlug));
  const updateName = (value: string) => {
    setName(value);
    if (!touched) setSlug(value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };
  return { name, slug, updateName, updateSlug: (value: string) => { setTouched(true); setSlug(value.toLowerCase()); } };
}

export type BrandRow = { id: string; name: string; nameAr: string | null; slug: string; originCountry: string | null; foundedYear: number | null; status: string; isFeatured: boolean; descriptionEn: string | null; descriptionAr: string | null; logoUrl: string | null; website: string | null; characteristics: string[]; searchAliases: string[]; productCount: number };

function BrandEditor({ brand }: { brand?: BrandRow }) {
  const action = brand ? updateBrand.bind(null, brand.id) : createBrand;
  const [state, formAction] = useFormState(action, initial);
  const naming = useSlug(brand?.name ?? '', brand?.slug ?? '');
  return <details open={!brand} className="rounded-lg border border-white/10 bg-white/[0.02]">
    <summary className="cursor-pointer list-none px-4 py-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-parchment">{brand?.name ?? 'Create brand'}</p>{brand && <p className="mt-1 text-[10px] text-smoke">{brand.productCount} products · {brand.status}</p>}</div><span className="text-[10px] text-gold-bright">{brand ? 'Edit' : 'New'}</span></div></summary>
    <form action={formAction} className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2">
      <Message state={state} />
      <label><span className="mb-1 block text-[10px] text-smoke">Name *</span><input name="name" value={naming.name} onChange={(e) => naming.updateName(e.target.value)} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">الاسم بالعربي</span><input dir="rtl" name="nameAr" defaultValue={brand?.nameAr ?? ''} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Slug *</span><input name="slug" value={naming.slug} onChange={(e) => naming.updateSlug(e.target.value)} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Status</span><select name="status" defaultValue={brand?.status ?? 'PUBLISHED'} className={inputClass}>{['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED'].map((v) => <option key={v}>{v}</option>)}</select></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Country</span><input name="originCountry" defaultValue={brand?.originCountry ?? ''} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Founded year</span><input type="number" name="foundedYear" defaultValue={brand?.foundedYear ?? ''} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Logo URL</span><input name="logoUrl" defaultValue={brand?.logoUrl ?? ''} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Website</span><input name="website" defaultValue={brand?.website ?? ''} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Description</span><textarea name="descriptionEn" defaultValue={brand?.descriptionEn ?? ''} rows={3} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">الوصف</span><textarea dir="rtl" name="descriptionAr" defaultValue={brand?.descriptionAr ?? ''} rows={3} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Characteristics (comma separated)</span><input name="characteristics" defaultValue={brand?.characteristics.join(', ')} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Search aliases</span><input name="searchAliases" defaultValue={brand?.searchAliases.join(', ')} className={inputClass} /></label>
      <label className="flex items-center gap-2 text-xs text-smoke"><input type="checkbox" name="isFeatured" defaultChecked={brand?.isFeatured} /> Featured brand</label>
      <div className="flex justify-end gap-2 md:col-span-2">{brand && <button type="submit" formAction={archiveBrand.bind(null, brand.id)} className="rounded-md border border-red-300/20 px-4 py-2 text-xs text-red-200">Archive</button>}<Submit label={brand ? 'Update brand' : 'Create brand'} /></div>
    </form>
  </details>;
}

export function BrandManager({ brands }: { brands: BrandRow[] }) {
  return <div className="space-y-3"><BrandEditor />{brands.map((brand) => <BrandEditor key={brand.id} brand={brand} />)}</div>;
}

export type CategoryRow = { id: string; nameEn: string; nameAr: string; slug: string; status: string; sortOrder: number; parentId: string | null; descriptionEn: string | null; descriptionAr: string | null; keywords: string[]; ogImage: string | null; productCount: number };

function CategoryEditor({ category, categories }: { category?: CategoryRow; categories: CategoryRow[] }) {
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction] = useFormState(action, initial);
  const naming = useSlug(category?.nameEn ?? '', category?.slug ?? '');
  return <details open={!category} className="rounded-lg border border-white/10 bg-white/[0.02]">
    <summary className="cursor-pointer list-none px-4 py-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-parchment">{category?.nameEn ?? 'Create category'}</p>{category && <p className="mt-1 text-[10px] text-smoke">{category.productCount} products · {category.status}</p>}</div><span className="text-[10px] text-gold-bright">{category ? 'Edit' : 'New'}</span></div></summary>
    <form action={formAction} className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2">
      <Message state={state} />
      <label><span className="mb-1 block text-[10px] text-smoke">Name (EN) *</span><input name="nameEn" value={naming.name} onChange={(e) => naming.updateName(e.target.value)} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">الاسم بالعربي *</span><input dir="rtl" name="nameAr" defaultValue={category?.nameAr ?? ''} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Slug *</span><input name="slug" value={naming.slug} onChange={(e) => naming.updateSlug(e.target.value)} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Status</span><select name="status" defaultValue={category?.status ?? 'PUBLISHED'} className={inputClass}>{['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED'].map((v) => <option key={v}>{v}</option>)}</select></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Parent category</span><select name="parentId" defaultValue={category?.parentId ?? ''} className={inputClass}><option value="">No parent</option>{categories.filter((item) => item.id !== category?.id).map((item) => <option key={item.id} value={item.id}>{item.nameEn}</option>)}</select></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Sort order</span><input type="number" min="0" name="sortOrder" defaultValue={category?.sortOrder ?? 0} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Description</span><textarea name="descriptionEn" defaultValue={category?.descriptionEn ?? ''} rows={3} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">الوصف</span><textarea dir="rtl" name="descriptionAr" defaultValue={category?.descriptionAr ?? ''} rows={3} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">Keywords</span><input name="keywords" defaultValue={category?.keywords.join(', ')} className={inputClass} /></label>
      <label><span className="mb-1 block text-[10px] text-smoke">OG image URL</span><input name="ogImage" defaultValue={category?.ogImage ?? ''} className={inputClass} /></label>
      <div className="flex justify-end gap-2 md:col-span-2">{category && <button type="submit" formAction={archiveCategory.bind(null, category.id)} className="rounded-md border border-red-300/20 px-4 py-2 text-xs text-red-200">Archive</button>}<Submit label={category ? 'Update category' : 'Create category'} /></div>
    </form>
  </details>;
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  return <div className="space-y-3"><CategoryEditor categories={categories} />{categories.map((category) => <CategoryEditor key={category.id} category={category} categories={categories} />)}</div>;
}
