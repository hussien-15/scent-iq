import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Globe2,
  Image as ImageIcon,
  Link2,
  Search,
  Sparkles,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import {
  applyMissingSeoTemplates,
  createSeoRedirect,
  deleteSeoRedirect,
  saveHomepageSeo,
  saveSeoEntity,
  saveSeoTemplate,
} from '@/actions/seo';
import { DEFAULT_SEO_TEMPLATES, getSeoScore, type SeoEntityType } from '@/services/seo.service';

export const dynamic = 'force-dynamic';

const TABS = [
  ['products', 'Products'],
  ['brands', 'Brands'],
  ['collections', 'Collections'],
  ['categories', 'Categories'],
  ['notes', 'Fragrance notes'],
  ['homepage', 'Homepage'],
  ['templates', 'Templates'],
  ['redirects', 'Redirects'],
] as const;

type EditorEntity = {
  id: string;
  type: SeoEntityType;
  name: string;
  nameAr: string;
  slug: string;
  score: ReturnType<typeof getSeoScore>;
  metaTitleAr: string | null;
  metaTitleEn: string | null;
  metaDescriptionAr: string | null;
  metaDescriptionEn: string | null;
  keywords: string[];
  ogImage: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  secondaryContentAr: string | null;
  secondaryContentEn: string | null;
  imageAltAr?: string | null;
  faqs: { questionAr: string; answerAr: string; questionEn: string | null; answerEn: string | null }[];
};

function scoreStyle(percent: number) {
  if (percent >= 80) return 'border-emerald-300/25 bg-emerald-300/[0.04] text-emerald-200';
  if (percent >= 55) return 'border-amber-300/25 bg-amber-300/[0.04] text-amber-100';
  return 'border-red-300/25 bg-red-300/[0.04] text-red-200';
}

function SeoEditor({ entity }: { entity: EditorEntity }) {
  return (
    <details className="group rounded-lg border border-white/10 bg-white/[0.015]">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border font-display text-sm ${scoreStyle(entity.score.percent)}`}
        >
          {entity.score.percent}%
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-parchment">{entity.nameAr || entity.name}</p>
          <p className="mt-1 truncate text-[10px] text-smoke">
            /{entity.slug} · {entity.score.missing.length ? `${entity.score.missing.length} missing signals` : 'Ready'}
          </p>
        </div>
        <span className="text-lg text-smoke transition-transform group-open:rotate-45">+</span>
      </summary>
      <form
        action={saveSeoEntity.bind(null, entity.type, entity.id)}
        className="space-y-5 border-t border-white/10 p-4"
      >
        {entity.score.missing.length > 0 && (
          <div className="rounded-md border border-amber-300/15 bg-amber-300/[0.03] p-3">
            <p className="text-[10px] font-medium text-amber-100">Missing</p>
            <p className="mt-1 text-[10px] leading-5 text-smoke">{entity.score.missing.join(' · ')}</p>
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Latin slug">
            <input name="slug" required defaultValue={entity.slug} className={inputClass} />
          </Field>
          <Field label="Keywords · comma separated">
            <input name="keywords" defaultValue={entity.keywords.join(', ')} className={inputClass} />
          </Field>
          <Field label="Arabic SEO title" hint="Recommended: 20–70 characters">
            <input name="metaTitleAr" dir="rtl" defaultValue={entity.metaTitleAr ?? ''} className={inputClass} />
          </Field>
          <Field label="English SEO title · secondary">
            <input name="metaTitleEn" defaultValue={entity.metaTitleEn ?? ''} className={inputClass} />
          </Field>
          <Field label="Arabic meta description" hint="Recommended: 70–180 characters">
            <textarea
              name="metaDescriptionAr"
              dir="rtl"
              rows={3}
              defaultValue={entity.metaDescriptionAr ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="English meta description · secondary">
            <textarea
              name="metaDescriptionEn"
              rows={3}
              defaultValue={entity.metaDescriptionEn ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Arabic helpful content">
            <textarea
              name="descriptionAr"
              dir="rtl"
              rows={6}
              defaultValue={entity.descriptionAr ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="English content · secondary">
            <textarea name="descriptionEn" rows={6} defaultValue={entity.descriptionEn ?? ''} className={inputClass} />
          </Field>
          <Field label="Arabic buying guide / supporting content">
            <textarea
              name="secondaryContentAr"
              dir="rtl"
              rows={5}
              defaultValue={entity.secondaryContentAr ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="English supporting content">
            <textarea
              name="secondaryContentEn"
              rows={5}
              defaultValue={entity.secondaryContentEn ?? ''}
              className={inputClass}
            />
          </Field>
          <Field label="Open Graph image URL">
            <input name="ogImage" type="url" defaultValue={entity.ogImage ?? ''} className={inputClass} />
          </Field>
          <Field label="Arabic primary image alt text">
            <input
              name="imageAltAr"
              dir="rtl"
              defaultValue={entity.imageAltAr ?? entity.nameAr}
              className={inputClass}
            />
          </Field>
        </div>
        <div>
          <h3 className="text-xs text-parchment">Useful FAQ · Arabic first</h3>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => {
              const faq = entity.faqs[index];
              return (
                <div key={index} className="space-y-2 rounded-md border border-white/10 p-3">
                  <p className="text-[9px] text-smoke">FAQ {index + 1}</p>
                  <input
                    name={`faqQuestionAr.${index}`}
                    dir="rtl"
                    placeholder="السؤال بالعربي"
                    defaultValue={faq?.questionAr ?? ''}
                    className={inputClass}
                  />
                  <textarea
                    name={`faqAnswerAr.${index}`}
                    dir="rtl"
                    rows={2}
                    placeholder="الإجابة بالعربي"
                    defaultValue={faq?.answerAr ?? ''}
                    className={inputClass}
                  />
                  <input
                    name={`faqQuestionEn.${index}`}
                    placeholder="English question · optional"
                    defaultValue={faq?.questionEn ?? ''}
                    className={inputClass}
                  />
                  <textarea
                    name={`faqAnswerEn.${index}`}
                    rows={2}
                    placeholder="English answer · optional"
                    defaultValue={faq?.answerEn ?? ''}
                    className={inputClass}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <button className="rounded-full bg-gold px-6 py-2.5 text-xs font-medium text-ink">Save SEO changes</button>
      </form>
    </details>
  );
}

const inputClass =
  'w-full rounded-md border border-white/10 bg-ink px-3 py-2.5 text-xs text-parchment placeholder:text-smoke focus:border-gold/40 focus:outline-none';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-[10px] text-smoke">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[9px] text-smoke/70">{hint}</span>}
    </label>
  );
}

export default async function StudioSeoPage({ searchParams }: { searchParams: { type?: string; q?: string } }) {
  const active = TABS.some(([key]) => key === searchParams.type) ? searchParams.type! : 'products';
  const q = searchParams.q?.trim().toLowerCase() ?? '';
  const [products, brands, collections, categories, notes, templates, settings, redirects, organicPages, topSearches] =
    await Promise.all([
      prisma.perfume.findMany({
        include: {
          brand: { select: { name: true, nameAr: true } },
          media: { where: { isPrimary: true }, take: 1 },
          notes: true,
          collections: true,
          faqs: { orderBy: { position: 'asc' } },
        },
        orderBy: { nameAr: 'asc' },
      }),
      prisma.brand.findMany({
        include: {
          perfumes: { select: { id: true }, take: 3 },
          similarTo: { select: { id: true }, take: 2 },
          faqs: { orderBy: { position: 'asc' } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.collection.findMany({
        include: {
          perfumes: { select: { id: true }, take: 3 },
          relatedFrom: { select: { id: true }, take: 2 },
          faqs: { orderBy: { position: 'asc' } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        include: { perfumes: { select: { id: true }, take: 3 }, faqs: { orderBy: { position: 'asc' } } },
        orderBy: { nameAr: 'asc' },
      }),
      prisma.note.findMany({
        include: { perfumeNotes: { select: { id: true }, take: 3 }, faqs: { orderBy: { position: 'asc' } } },
        orderBy: { nameAr: 'asc' },
      }),
      prisma.seoTemplate.findMany(),
      prisma.siteSetting.findMany({ where: { key: { startsWith: 'seo.' } } }),
      prisma.seoRedirect.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.analyticsEvent.groupBy({
        by: ['pathname'],
        where: { eventType: 'PAGE_VIEW', source: 'GOOGLE', pathname: { not: null } },
        _count: { pathname: true },
        orderBy: { _count: { pathname: 'desc' } },
        take: 8,
      }),
      prisma.searchLog.groupBy({
        by: ['keyword'],
        _count: { keyword: true },
        orderBy: { _count: { keyword: 'desc' } },
        take: 8,
      }),
    ]);
  const setting = new Map(
    settings.map((row) => [row.key, typeof row.value === 'string' ? row.value : JSON.stringify(row.value)])
  );

  const entities: Record<string, EditorEntity[]> = {
    products: products.map((item) => ({
      id: item.id,
      type: 'product',
      name: item.nameEn,
      nameAr: item.nameAr,
      slug: item.slug,
      metaTitleAr: item.metaTitleAr,
      metaTitleEn: item.metaTitleEn,
      metaDescriptionAr: item.metaDescriptionAr,
      metaDescriptionEn: item.metaDescriptionEn,
      keywords: item.keywords,
      ogImage: item.ogImage ?? item.media[0]?.url ?? null,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      secondaryContentAr: item.storyAr,
      secondaryContentEn: item.storyEn,
      faqs: item.faqs,
      score: getSeoScore({
        nameAr: item.nameAr,
        slug: item.slug,
        metaTitleAr: item.metaTitleAr,
        metaTitleEn: item.metaTitleEn,
        metaDescriptionAr: item.metaDescriptionAr,
        metaDescriptionEn: item.metaDescriptionEn,
        keywords: item.keywords,
        image: item.ogImage ?? item.media[0]?.url,
        descriptionAr: item.descriptionAr,
        secondaryContentAr: item.storyAr,
        faqs: item.faqs,
        internalLinks: item.collections.length + 2,
        altTextAr: item.media[0]?.altText,
      }),
    })),
    brands: brands.map((item) => ({
      id: item.id,
      type: 'brand',
      name: item.name,
      nameAr: item.nameAr ?? item.name,
      slug: item.slug,
      metaTitleAr: item.metaTitleAr,
      metaTitleEn: item.metaTitleEn,
      metaDescriptionAr: item.metaDescriptionAr,
      metaDescriptionEn: item.metaDescriptionEn,
      keywords: item.keywords,
      ogImage: item.ogImage ?? item.bannerUrl,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      secondaryContentAr: item.storyAr,
      secondaryContentEn: item.story,
      faqs: item.faqs,
      score: getSeoScore({
        nameAr: item.nameAr ?? item.name,
        slug: item.slug,
        metaTitleAr: item.metaTitleAr,
        metaTitleEn: item.metaTitleEn,
        metaDescriptionAr: item.metaDescriptionAr,
        metaDescriptionEn: item.metaDescriptionEn,
        keywords: item.keywords,
        image: item.ogImage ?? item.bannerUrl,
        descriptionAr: item.descriptionAr,
        secondaryContentAr: item.storyAr,
        faqs: item.faqs,
        internalLinks: item.perfumes.length + item.similarTo.length,
        altTextAr: item.nameAr,
      }),
    })),
    collections: collections.map((item) => ({
      id: item.id,
      type: 'collection',
      name: item.name,
      nameAr: item.nameAr ?? item.name,
      slug: item.slug,
      metaTitleAr: item.metaTitleAr,
      metaTitleEn: item.metaTitleEn,
      metaDescriptionAr: item.metaDescriptionAr,
      metaDescriptionEn: item.metaDescriptionEn,
      keywords: item.keywords,
      ogImage: item.ogImage ?? item.coverImage,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.description,
      secondaryContentAr: item.buyingGuideAr,
      secondaryContentEn: item.buyingGuide,
      faqs: item.faqs.map((faq) => ({
        questionAr: faq.questionAr ?? faq.questionEn,
        answerAr: faq.answerAr ?? faq.answerEn,
        questionEn: faq.questionEn,
        answerEn: faq.answerEn,
      })),
      score: getSeoScore({
        nameAr: item.nameAr ?? item.name,
        slug: item.slug,
        metaTitleAr: item.metaTitleAr,
        metaTitleEn: item.metaTitleEn,
        metaDescriptionAr: item.metaDescriptionAr,
        metaDescriptionEn: item.metaDescriptionEn,
        keywords: item.keywords,
        image: item.ogImage ?? item.coverImage,
        descriptionAr: item.descriptionAr,
        secondaryContentAr: item.buyingGuideAr,
        faqs: item.faqs,
        internalLinks: item.perfumes.length + item.relatedFrom.length,
        altTextAr: item.coverAltAr,
      }),
    })),
    categories: categories.map((item) => ({
      id: item.id,
      type: 'category',
      name: item.nameEn,
      nameAr: item.nameAr,
      slug: item.slug,
      metaTitleAr: item.metaTitleAr,
      metaTitleEn: item.metaTitleEn,
      metaDescriptionAr: item.metaDescriptionAr,
      metaDescriptionEn: item.metaDescriptionEn,
      keywords: item.keywords,
      ogImage: item.ogImage,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      secondaryContentAr: item.seoContentAr,
      secondaryContentEn: item.seoContentEn,
      faqs: item.faqs,
      score: getSeoScore({
        nameAr: item.nameAr,
        slug: item.slug,
        metaTitleAr: item.metaTitleAr,
        metaTitleEn: item.metaTitleEn,
        metaDescriptionAr: item.metaDescriptionAr,
        metaDescriptionEn: item.metaDescriptionEn,
        keywords: item.keywords,
        image: item.ogImage,
        descriptionAr: item.descriptionAr,
        secondaryContentAr: item.seoContentAr,
        faqs: item.faqs,
        internalLinks: item.perfumes.length + 1,
        altTextAr: item.nameAr,
      }),
    })),
    notes: notes.map((item) => ({
      id: item.id,
      type: 'note',
      name: item.nameEn,
      nameAr: item.nameAr,
      slug: item.slug,
      metaTitleAr: item.metaTitleAr,
      metaTitleEn: item.metaTitleEn,
      metaDescriptionAr: item.metaDescriptionAr,
      metaDescriptionEn: item.metaDescriptionEn,
      keywords: item.keywords,
      ogImage: item.ogImage,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      secondaryContentAr: null,
      secondaryContentEn: null,
      faqs: item.faqs,
      score: getSeoScore({
        nameAr: item.nameAr,
        slug: item.slug,
        metaTitleAr: item.metaTitleAr,
        metaTitleEn: item.metaTitleEn,
        metaDescriptionAr: item.metaDescriptionAr,
        metaDescriptionEn: item.metaDescriptionEn,
        keywords: item.keywords,
        image: item.ogImage,
        descriptionAr: item.descriptionAr,
        faqs: item.faqs,
        internalLinks: item.perfumeNotes.length + 1,
        altTextAr: item.nameAr,
      }),
    })),
  };
  const allEntities = Object.values(entities).flat();
  const averageScore = allEntities.length
    ? Math.round(allEntities.reduce((sum, entity) => sum + entity.score.percent, 0) / allEntities.length)
    : 0;
  const filtered = (entities[active] ?? []).filter(
    (entity) => !q || `${entity.name} ${entity.nameAr} ${entity.slug}`.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-7 pb-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Arabic-first organic visibility</p>
          <h1 className="font-display text-3xl text-parchment">SEO Manager</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-smoke">
            Manage metadata, content, FAQs, templates, canonical slugs, redirects, and search readiness. “Eligible
            pages” is not presented as Google-indexed pages without Search Console evidence.
          </p>
        </div>
        <form action={applyMissingSeoTemplates}>
          <button className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-medium text-ink">
            <Sparkles size={14} />
            Fill missing metadata from templates
          </button>
        </form>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Metric icon={Globe2} label="Eligible public entities" value={allEntities.length} />
        <Metric icon={CheckCircle2} label="Average SEO score" value={`${averageScore}%`} />
        <Metric
          icon={AlertTriangle}
          label="Missing Arabic title"
          value={allEntities.filter((entity) => !entity.metaTitleAr).length}
        />
        <Metric
          icon={FileText}
          label="Weak Arabic content"
          value={allEntities.filter((entity) => (entity.descriptionAr?.length ?? 0) < 140).length}
        />
        <Metric
          icon={ImageIcon}
          label="Missing share image"
          value={allEntities.filter((entity) => !entity.ogImage).length}
        />
        <Metric icon={Link2} label="Active redirects" value={redirects.filter((row) => row.isActive).length} />
        <Metric
          icon={ArrowUpRight}
          label="Tracked Google landings"
          value={organicPages.reduce((sum, row) => sum + row._count.pathname, 0)}
        />
        <Metric icon={Search} label="Internal search terms" value={topSearches.length} />
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`?type=${key}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-[11px] ${active === key ? 'border-gold bg-gold/10 text-gold-bright' : 'border-white/10 text-smoke'}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {entities[active] && (
        <section className="space-y-4">
          <form className="flex gap-2">
            <input type="hidden" name="type" value={active} />
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search name or slug…"
              className={`${inputClass} max-w-md`}
            />
            <button className="rounded-md border border-white/10 px-4 text-xs text-parchment">Search</button>
          </form>
          <div className="space-y-3">
            {filtered.map((entity) => (
              <SeoEditor key={entity.id} entity={entity} />
            ))}
            {!filtered.length && (
              <p className="rounded-lg border border-white/10 p-6 text-xs text-smoke">No matching entities.</p>
            )}
          </div>
        </section>
      )}

      {active === 'homepage' && (
        <section className="rounded-xl border border-white/10 p-5">
          <h2 className="font-display text-xl text-parchment">Homepage SEO</h2>
          <form action={saveHomepageSeo} className="mt-5 grid gap-4 lg:grid-cols-2">
            <Field label="Arabic title">
              <input
                name="titleAr"
                dir="rtl"
                defaultValue={setting.get('seo.home.titleAr') ?? 'عطور مختارة بعناية في العراق | ScentIQ'}
                className={inputClass}
              />
            </Field>
            <Field label="English title">
              <input
                name="titleEn"
                defaultValue={setting.get('seo.home.titleEn') ?? 'Carefully Selected Perfumes in Iraq | ScentIQ'}
                className={inputClass}
              />
            </Field>
            <Field label="Arabic description">
              <textarea
                name="descriptionAr"
                dir="rtl"
                rows={4}
                defaultValue={
                  setting.get('seo.home.descriptionAr') ??
                  'اكتشف عطورًا مختارة بعناية مع تفاصيل النوتات والأداء والمراجعات وخيارات الطلب داخل العراق.'
                }
                className={inputClass}
              />
            </Field>
            <Field label="English description">
              <textarea
                name="descriptionEn"
                rows={4}
                defaultValue={
                  setting.get('seo.home.descriptionEn') ??
                  'Discover carefully selected perfumes with notes, performance details, reviews, and ordering options across Iraq.'
                }
                className={inputClass}
              />
            </Field>
            <Field label="Keywords">
              <input
                name="keywords"
                defaultValue={setting.get('seo.home.keywords') ?? 'عطور, عطور في العراق, الدفع عند الاستلام, ScentIQ'}
                className={inputClass}
              />
            </Field>
            <Field label="Open Graph image">
              <input
                name="ogImage"
                type="url"
                defaultValue={setting.get('seo.home.ogImage') ?? ''}
                className={inputClass}
              />
            </Field>
            <button className="w-fit rounded-full bg-gold px-6 py-2.5 text-xs font-medium text-ink">
              Save homepage SEO
            </button>
          </form>
        </section>
      )}

      {active === 'templates' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {Object.entries(DEFAULT_SEO_TEMPLATES).map(([pageType, defaults]) => {
            const saved = templates.find((template) => template.pageType === pageType);
            return (
              <form
                key={pageType}
                action={saveSeoTemplate.bind(null, pageType as keyof typeof DEFAULT_SEO_TEMPLATES)}
                className="space-y-3 rounded-xl border border-white/10 p-5"
              >
                <h2 className="font-display text-lg text-parchment">{pageType}</h2>
                <Field label="Arabic title template">
                  <input
                    name="titleTemplateAr"
                    dir="rtl"
                    required
                    defaultValue={saved?.titleTemplateAr ?? defaults.titleAr}
                    className={inputClass}
                  />
                </Field>
                <Field label="English title template">
                  <input
                    name="titleTemplateEn"
                    defaultValue={saved?.titleTemplateEn ?? defaults.titleEn}
                    className={inputClass}
                  />
                </Field>
                <Field label="Arabic description template">
                  <textarea
                    name="descriptionTemplateAr"
                    dir="rtl"
                    rows={4}
                    required
                    defaultValue={saved?.descriptionTemplateAr ?? defaults.descriptionAr}
                    className={inputClass}
                  />
                </Field>
                <Field label="English description template">
                  <textarea
                    name="descriptionTemplateEn"
                    rows={4}
                    defaultValue={saved?.descriptionTemplateEn ?? defaults.descriptionEn}
                    className={inputClass}
                  />
                </Field>
                <button className="rounded-full border border-gold/40 px-4 py-2 text-xs text-gold-bright">
                  Save template
                </button>
              </form>
            );
          })}
        </section>
      )}

      {active === 'redirects' && (
        <section className="space-y-5">
          <form
            action={createSeoRedirect}
            className="grid gap-3 rounded-xl border border-white/10 p-5 md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <input name="oldPath" required placeholder="/product/old-slug" className={inputClass} />
            <input name="newPath" required placeholder="/product/new-slug" className={inputClass} />
            <input name="note" placeholder="Reason · optional" className={inputClass} />
            <button className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink">Add 308 redirect</button>
          </form>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-white/10 text-smoke">
                <tr>
                  <th className="p-3 font-normal">Old path</th>
                  <th className="p-3 font-normal">New path</th>
                  <th className="p-3 font-normal">Code</th>
                  <th className="p-3 font-normal">Hits</th>
                  <th className="p-3 font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((row) => (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="p-3 text-parchment">{row.oldPath}</td>
                    <td className="p-3 text-smoke">{row.newPath}</td>
                    <td className="p-3 text-smoke">{row.statusCode}</td>
                    <td className="p-3 text-smoke">{row.hits}</td>
                    <td className="p-3">
                      <form action={deleteSeoRedirect.bind(null, row.id)}>
                        <button className="text-red-200">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 p-5">
          <h2 className="text-sm text-parchment">Top tracked organic landing pages</h2>
          <ul className="mt-4 space-y-2 text-xs">
            {organicPages.map((row) => (
              <li key={row.pathname} className="flex justify-between gap-3 text-smoke">
                <span className="truncate">{row.pathname}</span>
                <strong className="text-parchment">{row._count.pathname}</strong>
              </li>
            ))}
            {!organicPages.length && <li className="text-smoke">No Google-referred session has been tracked yet.</li>}
          </ul>
        </section>
        <section className="rounded-xl border border-white/10 p-5">
          <h2 className="text-sm text-parchment">Top internal search terms</h2>
          <ul className="mt-4 space-y-2 text-xs">
            {topSearches.map((row) => (
              <li key={row.keyword} className="flex justify-between text-smoke">
                <span>{row.keyword}</span>
                <strong className="text-parchment">{row._count.keyword}</strong>
              </li>
            ))}
            {!topSearches.length && <li className="text-smoke">No internal searches yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Globe2; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <Icon size={14} className="text-gold" />
      <p className="mt-3 font-display text-xl text-parchment">{value}</p>
      <p className="mt-1 text-[9px] text-smoke">{label}</p>
    </div>
  );
}
