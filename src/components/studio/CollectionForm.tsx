'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { ArrowLeft, Check, Image as ImageIcon, Search, Sparkles } from 'lucide-react';
import {
  createCollection,
  updateCollection,
  type CollectionActionState,
} from '@/actions/collection';
import {
  COLLECTION_FAMILIES,
  COLLECTION_OCCASIONS,
  COLLECTION_SEASONS,
  COLLECTION_STYLES,
  PERFORMANCE_LEVELS,
  type CollectionRules,
} from '@/services/collection.service';

type ProductOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  price: string;
  brandName: string;
};

type Placement = {
  perfumeId: string;
  position: number;
  pinned: boolean;
  featuredLabelEn: string | null;
  featuredLabelAr: string | null;
  featuredReasonEn: string | null;
  featuredReasonAr: string | null;
};

type Faq = {
  questionEn: string;
  questionAr: string | null;
  answerEn: string;
  answerAr: string | null;
};

export type CollectionEditorData = {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  type: 'MANUAL' | 'DYNAMIC' | 'HYBRID';
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED' | 'SCHEDULED';
  shortDescription: string | null;
  shortDescriptionAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  buyingGuide: string | null;
  buyingGuideAr: string | null;
  coverImage: string | null;
  coverAlt: string | null;
  coverAltAr: string | null;
  manualOrdering: boolean;
  featuredOnHomepage: boolean;
  homepageOrder: number;
  scheduledAt: string | null;
  metaTitleEn: string | null;
  metaTitleAr: string | null;
  metaDescriptionEn: string | null;
  metaDescriptionAr: string | null;
  keywords: string[];
  ogImage: string | null;
  rules: CollectionRules;
  perfumes: Placement[];
  faqs: Faq[];
  relatedCollectionIds: string[];
};

type FormProps = {
  collection?: CollectionEditorData;
  products: ProductOption[];
  brands: Array<{ id: string; name: string }>;
  notes: Array<{ id: string; nameEn: string; nameAr: string }>;
  collections: Array<{ id: string; name: string }>;
};

const inputClass =
  'w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-parchment placeholder:text-smoke/60 focus:border-studioBlue/60 focus:outline-none';
const labelClass = 'mb-1.5 block text-xs text-smoke';
const initialState: CollectionActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-gold px-5 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-gold-bright disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Save collection'}
    </button>
  );
}

function FieldError({ state, name }: { state: CollectionActionState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <p className="mt-1 text-xs text-red-300">{message}</p> : null;
}

function CheckboxGroup({
  name,
  options,
  selected,
}: {
  name: string;
  options: Array<{ value: string; label: string }>;
  selected?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selected?.includes(option.value)}
            className="peer sr-only"
          />
          <span className="inline-flex rounded-full border border-white/10 px-3 py-1.5 text-xs text-smoke transition-colors peer-checked:border-studioBlue/60 peer-checked:bg-studioBlue/10 peer-checked:text-studioBlue">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function Section({
  title,
  description,
  children,
  open = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="rounded-lg border border-white/10 bg-white/[0.02]">
      <summary className="cursor-pointer list-none px-5 py-4">
        <h2 className="text-sm font-medium text-parchment">{title}</h2>
        <p className="mt-1 text-xs text-smoke">{description}</p>
      </summary>
      <div className="border-t border-white/10 p-5">{children}</div>
    </details>
  );
}

export default function CollectionForm({ collection, products, brands, notes, collections }: FormProps) {
  const action = collection ? updateCollection.bind(null, collection.id) : createCollection;
  const [state, formAction] = useFormState(action, initialState);
  const [type, setType] = useState(collection?.type ?? 'MANUAL');
  const [status, setStatus] = useState(collection?.status ?? 'DRAFT');
  const [name, setName] = useState(collection?.name ?? '');
  const [slug, setSlug] = useState(collection?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(collection));
  const [coverImage, setCoverImage] = useState(collection?.coverImage ?? '');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(
    new Set(collection?.perfumes.map((item) => item.perfumeId) ?? [])
  );

  const placements = useMemo(
    () => new Map(collection?.perfumes.map((item) => [item.perfumeId, item]) ?? []),
    [collection]
  );
  const visibleProducts = products.filter((product) => {
    const query = productSearch.toLowerCase();
    return (
      product.nameEn.toLowerCase().includes(query) ||
      product.nameAr.includes(productSearch) ||
      product.sku.toLowerCase().includes(query) ||
      product.brandName.toLowerCase().includes(query)
    );
  });

  function updateName(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    setUploadingCover(true);
    setCoverUploadError('');
    const payload = new FormData();
    payload.set('file', file);
    try {
      const response = await fetch('/api/studio/media/upload', { method: 'POST', body: payload });
      const result = (await response.json()) as { success: boolean; data?: { url: string }; error?: string };
      if (!response.ok || !result.success || !result.data?.url) throw new Error(result.error ?? 'Upload failed.');
      setCoverImage(result.data.url);
    } catch (error) {
      setCoverUploadError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploadingCover(false);
    }
  }

  return (
    <form action={formAction} className="pb-24">
      <div className="sticky top-0 z-20 -mx-6 mb-6 flex items-center justify-between border-b border-white/10 bg-ink/95 px-6 py-4 backdrop-blur">
        <div>
          <Link href="/studio/collections" className="mb-1 flex items-center gap-1 text-xs text-smoke hover:text-parchment">
            <ArrowLeft size={13} /> Back to collections
          </Link>
          <h1 className="font-display text-2xl text-parchment">
            {collection ? `Edit ${collection.name}` : 'Create collection'}
          </h1>
        </div>
        <SaveButton />
      </div>

      {state.error && (
        <div className="mb-5 rounded-md border border-red-300/20 bg-red-300/10 px-4 py-3 text-xs text-red-200">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <Section title="1. Identity & story" description="Bilingual title, introduction, and the editorial buying guide." open>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className={labelClass}>Name (English) *</span>
                <input name="name" value={name} onChange={(event) => updateName(event.target.value)} className={inputClass} />
                <FieldError state={state} name="name" />
              </label>
              <label>
                <span className={labelClass}>الاسم بالعربي *</span>
                <input name="nameAr" dir="rtl" defaultValue={collection?.nameAr ?? ''} className={inputClass} />
                <FieldError state={state} name="nameAr" />
              </label>
              <label className="md:col-span-2">
                <span className={labelClass}>Slug *</span>
                <input
                  name="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value.toLowerCase());
                  }}
                  placeholder="winter-perfumes"
                  className={inputClass}
                />
                <FieldError state={state} name="slug" />
              </label>
              <label>
                <span className={labelClass}>Short description (English)</span>
                <textarea name="shortDescription" rows={3} maxLength={240} defaultValue={collection?.shortDescription ?? ''} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>الوصف المختصر</span>
                <textarea name="shortDescriptionAr" dir="rtl" rows={3} maxLength={240} defaultValue={collection?.shortDescriptionAr ?? ''} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Editorial introduction (English)</span>
                <textarea name="description" rows={7} defaultValue={collection?.description ?? ''} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>المقدمة التحريرية</span>
                <textarea name="descriptionAr" dir="rtl" rows={7} defaultValue={collection?.descriptionAr ?? ''} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>Buying guide (English)</span>
                <textarea name="buyingGuide" rows={6} defaultValue={collection?.buyingGuide ?? ''} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>دليل الشراء</span>
                <textarea name="buyingGuideAr" dir="rtl" rows={6} defaultValue={collection?.buyingGuideAr ?? ''} className={inputClass} />
              </label>
            </div>
          </Section>

          <Section title="2. Cover media" description="Cloudinary-ready cover and social image URLs.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className={labelClass}>Upload cover image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingCover}
                  onChange={(event) => void uploadCover(event.target.files?.[0])}
                  className="w-full rounded-md border border-dashed border-white/15 bg-white/[0.03] px-3 py-4 text-xs text-smoke file:me-3 file:rounded-full file:border-0 file:bg-studioBlue/10 file:px-3 file:py-1.5 file:text-studioBlue"
                />
                <p className="mt-1 text-[11px] text-smoke">{uploadingCover ? 'Uploading image…' : 'JPG, PNG, or WebP · maximum 8 MB'}</p>
                {coverUploadError && <p className="mt-1 text-xs text-red-300">{coverUploadError}</p>}
              </label>
              <label className="md:col-span-2">
                <span className={labelClass}>Cover image URL</span>
                <input name="coverImage" value={coverImage} onChange={(event) => setCoverImage(event.target.value)} placeholder="https://res.cloudinary.com/..." className={inputClass} />
                <FieldError state={state} name="coverImage" />
              </label>
              <label>
                <span className={labelClass}>Cover alt text (English)</span>
                <input name="coverAlt" defaultValue={collection?.coverAlt ?? ''} className={inputClass} />
              </label>
              <label>
                <span className={labelClass}>وصف صورة الغلاف</span>
                <input name="coverAltAr" dir="rtl" defaultValue={collection?.coverAltAr ?? ''} className={inputClass} />
              </label>
              <label className="md:col-span-2">
                <span className={labelClass}>Open Graph image URL</span>
                <input name="ogImage" defaultValue={collection?.ogImage ?? ''} className={inputClass} />
                <FieldError state={state} name="ogImage" />
              </label>
            </div>
          </Section>

          <Section title="3. Collection logic" description="Manual selection, dynamic rules, or a hybrid of both.">
            <div className="mb-5 grid gap-4 md:grid-cols-3">
              {(['MANUAL', 'DYNAMIC', 'HYBRID'] as const).map((value) => (
                <label key={value} className={`cursor-pointer rounded-md border p-4 ${type === value ? 'border-studioBlue/60 bg-studioBlue/10' : 'border-white/10'}`}>
                  <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only" />
                  <span className="text-sm text-parchment">{value[0] + value.slice(1).toLowerCase()}</span>
                  <span className="mt-1 block text-xs text-smoke">
                    {value === 'MANUAL' ? 'Only selected perfumes' : value === 'DYNAMIC' ? 'Products matching rules' : 'Rules plus pinned picks'}
                  </span>
                </label>
              ))}
            </div>

            {type !== 'MANUAL' && (
              <div className="space-y-5 rounded-md border border-white/10 p-4">
                <div>
                  <p className={labelClass}>Brands</p>
                  <CheckboxGroup name="ruleBrandIds" options={brands.map((brand) => ({ value: brand.id, label: brand.name }))} selected={collection?.rules.brandIds} />
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <p className={labelClass}>Gender</p>
                    <CheckboxGroup name="ruleGenders" options={['MASCULINE', 'FEMININE', 'UNISEX'].map((value) => ({ value, label: value }))} selected={collection?.rules.genders} />
                  </div>
                  <div>
                    <p className={labelClass}>Availability</p>
                    <CheckboxGroup name="ruleAvailability" options={['IN_STOCK', 'PREORDER', 'OUT_OF_STOCK'].map((value) => ({ value, label: value.replaceAll('_', ' ') }))} selected={collection?.rules.availability} />
                  </div>
                  <div>
                    <p className={labelClass}>Fragrance family</p>
                    <CheckboxGroup name="ruleFamilies" options={COLLECTION_FAMILIES.map((value) => ({ value, label: value }))} selected={collection?.rules.scentFamilies} />
                  </div>
                  <div>
                    <p className={labelClass}>Season</p>
                    <CheckboxGroup name="ruleSeasons" options={COLLECTION_SEASONS.map((value) => ({ value, label: value }))} selected={collection?.rules.seasons} />
                  </div>
                  <div>
                    <p className={labelClass}>Occasion</p>
                    <CheckboxGroup name="ruleOccasions" options={COLLECTION_OCCASIONS.map((value) => ({ value, label: value }))} selected={collection?.rules.occasions} />
                  </div>
                  <div>
                    <p className={labelClass}>Style</p>
                    <CheckboxGroup name="ruleStyles" options={COLLECTION_STYLES.map((value) => ({ value, label: value }))} selected={collection?.rules.styles} />
                  </div>
                </div>
                <div>
                  <p className={labelClass}>Notes</p>
                  <CheckboxGroup name="ruleNoteIds" options={notes.map((note) => ({ value: note.id, label: `${note.nameEn} / ${note.nameAr}` }))} selected={collection?.rules.noteIds} />
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  {(['Longevity', 'Projection', 'Sillage'] as const).map((metric) => (
                    <div key={metric}>
                      <p className={labelClass}>{metric}</p>
                      <CheckboxGroup
                        name={`rule${metric}`}
                        options={PERFORMANCE_LEVELS.map((value) => ({ value, label: value.replace('_', ' ') }))}
                        selected={collection?.rules[metric.toLowerCase() as 'longevity' | 'projection' | 'sillage']}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label><span className={labelClass}>Minimum price</span><input type="number" min="0" step="0.01" name="rulePriceMin" defaultValue={collection?.rules.priceMin} className={inputClass} /></label>
                  <label><span className={labelClass}>Maximum price</span><input type="number" min="0" step="0.01" name="rulePriceMax" defaultValue={collection?.rules.priceMax} className={inputClass} /></label>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-smoke">
                  {[
                    ['ruleDiscounted', 'Discounted products', collection?.rules.discounted],
                    ['ruleNewArrivals', 'New arrivals (45 days)', collection?.rules.newArrivals],
                    ['ruleBestSellers', 'Best sellers', collection?.rules.bestSellers],
                    ['ruleTrending', 'Trending', collection?.rules.trending],
                    ['ruleLowStock', 'Low stock', collection?.rules.lowStock],
                    ['ruleMostViewed', 'Most viewed', collection?.rules.mostViewed],
                    ['ruleMostWishlisted', 'Most wishlisted', collection?.rules.mostWishlisted],
                  ].map(([field, label, checked]) => (
                    <label key={String(field)} className="flex items-center gap-2"><input type="checkbox" name={String(field)} defaultChecked={Boolean(checked)} className="accent-studioBlue" />{String(label)}</label>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="4. Products & editorial order" description="Select, pin, reorder, and explain highlighted perfumes.">
            <div className="mb-4 flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
              <Search size={14} className="text-smoke" />
              <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products, brands, or SKU…" className="w-full bg-transparent py-2.5 text-xs text-parchment outline-none" />
            </div>
            <label className="mb-4 flex items-center gap-2 text-xs text-smoke">
              <input type="checkbox" name="manualOrdering" defaultChecked={collection?.manualOrdering ?? true} className="accent-studioBlue" />
              Manual order overrides featured sorting
            </label>
            <div className="max-h-[620px] space-y-2 overflow-y-auto pe-1">
              {visibleProducts.map((product, index) => {
                const checked = selectedProducts.has(product.id);
                const placement = placements.get(product.id);
                return (
                  <div key={product.id} className={`rounded-md border p-3 ${checked ? 'border-studioBlue/40 bg-studioBlue/5' : 'border-white/10'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="productIds"
                        value={product.id}
                        checked={checked}
                        onChange={(event) => {
                          const next = new Set(selectedProducts);
                          if (event.target.checked) next.add(product.id);
                          else next.delete(product.id);
                          setSelectedProducts(next);
                        }}
                        className="accent-studioBlue"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-parchment">{product.nameEn} <span className="text-smoke">/ {product.nameAr}</span></p>
                        <p className="text-[11px] text-smoke">{product.brandName} · {product.sku} · ${product.price}</p>
                      </div>
                      {checked && <Check size={14} className="text-studioBlue" />}
                    </div>
                    {checked && (
                      <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 md:grid-cols-2">
                        <label><span className={labelClass}>Position</span><input type="number" min="0" name={`position.${product.id}`} defaultValue={placement?.position ?? index} className={inputClass} /></label>
                        <label className="flex items-end gap-2 pb-2 text-xs text-smoke"><input type="checkbox" name="pinnedProductIds" value={product.id} defaultChecked={placement?.pinned} className="accent-gold" />Pin as featured</label>
                        <label><span className={labelClass}>Featured label</span><input name={`featuredLabelEn.${product.id}`} defaultValue={placement?.featuredLabelEn ?? ''} placeholder="Best overall" className={inputClass} /></label>
                        <label><span className={labelClass}>التصنيف المميز</span><input dir="rtl" name={`featuredLabelAr.${product.id}`} defaultValue={placement?.featuredLabelAr ?? ''} placeholder="الأفضل بشكل عام" className={inputClass} /></label>
                        <label><span className={labelClass}>Why we picked it</span><textarea rows={2} name={`featuredReasonEn.${product.id}`} defaultValue={placement?.featuredReasonEn ?? ''} className={inputClass} /></label>
                        <label><span className={labelClass}>سبب الاختيار</span><textarea dir="rtl" rows={2} name={`featuredReasonAr.${product.id}`} defaultValue={placement?.featuredReasonAr ?? ''} className={inputClass} /></label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="5. FAQs" description="Up to six bilingual questions for guidance and structured SEO.">
            <div className="space-y-5">
              {Array.from({ length: 6 }, (_, index) => {
                const faq = collection?.faqs[index];
                return (
                  <div key={index} className="grid gap-3 rounded-md border border-white/10 p-4 md:grid-cols-2">
                    <p className="eyebrow md:col-span-2">FAQ {index + 1}</p>
                    <input name={`faqQuestionEn.${index}`} defaultValue={faq?.questionEn ?? ''} placeholder="Question in English" className={inputClass} />
                    <input name={`faqQuestionAr.${index}`} dir="rtl" defaultValue={faq?.questionAr ?? ''} placeholder="السؤال بالعربي" className={inputClass} />
                    <textarea name={`faqAnswerEn.${index}`} rows={3} defaultValue={faq?.answerEn ?? ''} placeholder="Answer in English" className={inputClass} />
                    <textarea name={`faqAnswerAr.${index}`} dir="rtl" rows={3} defaultValue={faq?.answerAr ?? ''} placeholder="الجواب بالعربي" className={inputClass} />
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="6. SEO" description="Localized metadata, keywords, canonical URLs, and structured data are generated automatically.">
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className={labelClass}>SEO title (English)</span><input name="metaTitleEn" maxLength={70} defaultValue={collection?.metaTitleEn ?? ''} className={inputClass} /><FieldError state={state} name="metaTitleEn" /></label>
              <label><span className={labelClass}>عنوان SEO بالعربي</span><input name="metaTitleAr" dir="rtl" maxLength={70} defaultValue={collection?.metaTitleAr ?? ''} className={inputClass} /><FieldError state={state} name="metaTitleAr" /></label>
              <label><span className={labelClass}>Meta description (English)</span><textarea name="metaDescriptionEn" rows={3} maxLength={170} defaultValue={collection?.metaDescriptionEn ?? ''} className={inputClass} /><FieldError state={state} name="metaDescriptionEn" /></label>
              <label><span className={labelClass}>وصف البحث بالعربي</span><textarea name="metaDescriptionAr" dir="rtl" rows={3} maxLength={170} defaultValue={collection?.metaDescriptionAr ?? ''} className={inputClass} /><FieldError state={state} name="metaDescriptionAr" /></label>
              <label className="md:col-span-2"><span className={labelClass}>Keywords (comma separated)</span><input name="keywords" defaultValue={collection?.keywords.join(', ') ?? ''} placeholder="winter perfumes, عطور شتوية، عطور قوية" className={inputClass} /></label>
            </div>
          </Section>

          <Section title="7. Related collections" description="Help customers continue exploring connected fragrance guides.">
            <CheckboxGroup name="relatedCollectionIds" options={collections.filter((item) => item.id !== collection?.id).map((item) => ({ value: item.id, label: item.name }))} selected={collection?.relatedCollectionIds} />
          </Section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-white/10 p-4">
            <p className="mb-3 text-sm font-medium text-parchment">Publishing</p>
            <label>
              <span className={labelClass}>Status</span>
              <select name="status" value={status} onChange={(event) => setStatus(event.target.value as CollectionEditorData['status'])} className={inputClass}>
                {['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'SCHEDULED'].map((value) => <option key={value} value={value} className="bg-ink">{value}</option>)}
              </select>
              <FieldError state={state} name="status" />
            </label>
            {status === 'SCHEDULED' && (
              <label className="mt-4 block"><span className={labelClass}>Publish at</span><input type="datetime-local" name="scheduledAt" defaultValue={collection?.scheduledAt?.slice(0, 16) ?? ''} className={inputClass} /><FieldError state={state} name="scheduledAt" /></label>
            )}
          </div>

          <div className="rounded-lg border border-white/10 p-4">
            <p className="mb-3 text-sm font-medium text-parchment">Homepage</p>
            <label className="flex items-center gap-2 text-xs text-smoke"><input type="checkbox" name="featuredOnHomepage" defaultChecked={collection?.featuredOnHomepage} className="accent-gold" />Feature this collection</label>
            <label className="mt-4 block"><span className={labelClass}>Display order</span><input type="number" min="0" name="homepageOrder" defaultValue={collection?.homepageOrder ?? 0} className={inputClass} /></label>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="relative aspect-[4/3] bg-white/5">
              {coverImage ? (
                <Image src={coverImage} alt="Cover preview" fill quality={70} sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-smoke"><ImageIcon size={24} /><span className="text-xs">Cover preview</span></div>
              )}
            </div>
            <div className="p-4">
              <p className="eyebrow">Collection preview</p>
              <p className="mt-2 font-display text-xl text-parchment">{name || 'Collection name'}</p>
              <p className="mt-1 text-xs text-smoke">/{slug || 'collection-slug'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-studioBlue/20 bg-studioBlue/5 p-4 text-xs leading-5 text-smoke">
            <Sparkles size={16} className="mb-2 text-studioBlue" />
            Dynamic rules refresh the catalog automatically. Pinned products always stay at the top of hybrid collections.
          </div>
        </aside>
      </div>
    </form>
  );
}
