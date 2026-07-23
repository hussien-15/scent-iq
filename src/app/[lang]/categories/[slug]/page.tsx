import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Breadcrumb from '@/components/Breadcrumb';
import ProductCard from '@/components/ProductCard';
import { getDictionary, type Locale } from '@/lib/i18n';
import { localized } from '@/utils/localized';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd, serializeJsonLd } from '@/utils/seo';
import { tagLabel } from '@/lib/tag-labels';

export const revalidate = 900;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params, searchParams }: { params: { lang: Locale; slug: string }; searchParams: { gender?: string; season?: string } }): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) return {};
  const ar = params.lang === 'ar';
  return buildMetadata({
    title: (ar ? category.metaTitleAr : category.metaTitleEn) ?? localized(params.lang, category.nameEn, category.nameAr),
    description: (ar ? category.metaDescriptionAr : category.metaDescriptionEn) ?? localized(params.lang, category.descriptionEn ?? `Explore ${category.nameEn} at ScentIQ.`, category.descriptionAr ?? `اكتشف ${category.nameAr} عبر ScentIQ مع معلومات واضحة تساعدك على الاختيار.`),
    path: `/categories/${category.slug}`, locale: params.lang, image: category.ogImage ?? undefined, keywords: category.keywords,
    noIndex: Boolean(searchParams.gender || searchParams.season),
  });
}

export default async function CategoryPage({ params, searchParams }: { params: { lang: Locale; slug: string }; searchParams: { gender?: string; season?: string } }) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug }, include: { faqs: { orderBy: { position: 'asc' } } } });
  if (!category) notFound();
  const validGender = ['MASCULINE', 'FEMININE', 'UNISEX'].includes(searchParams.gender ?? '') ? searchParams.gender as 'MASCULINE' | 'FEMININE' | 'UNISEX' : undefined;
  const perfumes = await prisma.perfume.findMany({ where: { categoryId: category.id, status: 'PUBLISHED', availability: { not: 'HIDDEN' }, ...(validGender ? { gender: validGender } : {}), ...(searchParams.season ? { season: { has: searchParams.season } } : {}) }, include: { brand: { select: { name: true, nameAr: true } } }, orderBy: [{ purchaseCount: 'desc' }, { nameAr: 'asc' }] });
  const relatedCollections = await prisma.collection.findMany({ where: { status: 'PUBLISHED', perfumes: { some: { perfume: { categoryId: category.id, status: 'PUBLISHED' } } } }, take: 4, orderBy: { homepageOrder: 'asc' } });
  const dict = getDictionary(params.lang);
  const name = localized(params.lang, category.nameEn, category.nameAr);
  const description = localized(params.lang, category.descriptionEn ?? '', category.descriptionAr);
  const seoContent = localized(params.lang, category.seoContentEn ?? '', category.seoContentAr);
  const faqs = category.faqs.map((faq) => ({ question: localized(params.lang, faq.questionEn ?? faq.questionAr, faq.questionAr), answer: localized(params.lang, faq.answerEn ?? faq.answerAr, faq.answerAr) }));
  const breadcrumbs = [{ name: dict.product.breadcrumbHome, path: `/${params.lang}` }, { name, path: `/${params.lang}/categories/${category.slug}` }];
  return <main className="mx-auto max-w-6xl px-6 py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd(breadcrumbs)) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({ '@context': 'https://schema.org', '@type': 'CollectionPage', name, description, url: absoluteUrl(`/${params.lang}/categories/${category.slug}`), mainEntity: { '@type': 'ItemList', numberOfItems: perfumes.length, itemListElement: perfumes.map((perfume, index) => ({ '@type': 'ListItem', position: index + 1, name: localized(params.lang, perfume.nameEn, perfume.nameAr), url: absoluteUrl(`/${params.lang}/product/${perfume.slug}`) })) } }) }} />
    {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd(faqs)) }} />}
    <Breadcrumb lang={params.lang} items={[{ label: dict.product.breadcrumbHome, href: `/${params.lang}` }, { label: name }]} />
    <header className="max-w-3xl"><p className="eyebrow mb-3">{params.lang === 'ar' ? 'دليل التصنيف' : 'Category guide'}</p><h1 className="font-display text-4xl text-parchment md:text-5xl">{name}</h1>{description && <p className="mt-5 text-sm leading-7 text-smoke">{description}</p>}</header>
    <div className="mt-10 flex flex-wrap gap-2"><Link href={`/${params.lang}/categories/${category.slug}`} className="rounded-full border border-gold/50 px-4 py-2 text-xs text-gold-bright">{params.lang === 'ar' ? 'الكل' : 'All'}</Link>{['MASCULINE', 'FEMININE', 'UNISEX'].map((gender) => <Link key={gender} href={`/${params.lang}/categories/${category.slug}?gender=${gender}`} className="rounded-full border border-ink-line px-4 py-2 text-xs text-smoke hover:border-gold/40">{tagLabel(gender, params.lang)}</Link>)}{['summer', 'winter'].map((season) => <Link key={season} href={`/${params.lang}/categories/${category.slug}?season=${season}`} className="rounded-full border border-ink-line px-4 py-2 text-xs text-smoke hover:border-gold/40">{tagLabel(season, params.lang)}</Link>)}</div>
    <section className="mt-12"><div className="mb-6 flex items-end justify-between"><h2 className="font-display text-2xl text-parchment">{params.lang === 'ar' ? 'العطور المتوفرة' : 'Available perfumes'}</h2><span className="text-xs text-smoke">{perfumes.length}</span></div>{perfumes.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{perfumes.map((perfume) => <ProductCard key={perfume.id} product={perfume} lang={params.lang} />)}</div> : <p className="rounded-lg border border-ink-line p-8 text-center text-sm text-smoke">{params.lang === 'ar' ? 'لا توجد عطور مطابقة لهذا الفلتر حاليًا.' : 'No perfumes match this filter yet.'}</p>}</section>
    {seoContent && <section className="mx-auto mt-16 max-w-3xl border-t border-ink-line pt-12"><h2 className="font-display text-2xl text-parchment">{params.lang === 'ar' ? `دليل اختيار ${name}` : `${name} buying guide`}</h2><p className="mt-5 whitespace-pre-line text-sm leading-8 text-smoke">{seoContent}</p></section>}
    {faqs.length > 0 && <section className="mx-auto mt-16 max-w-3xl border-t border-ink-line pt-12"><h2 className="mb-5 font-display text-2xl text-parchment">{params.lang === 'ar' ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2>{faqs.map((faq) => <details key={faq.question} className="border-b border-ink-line py-4"><summary className="cursor-pointer text-sm text-parchment">{faq.question}</summary><p className="mt-3 text-sm leading-7 text-smoke">{faq.answer}</p></details>)}</section>}
    {relatedCollections.length > 0 && <section className="mt-16 border-t border-ink-line pt-12"><h2 className="mb-5 font-display text-2xl text-parchment">{params.lang === 'ar' ? 'أدلة ومجموعات مرتبطة' : 'Related guides and collections'}</h2><div className="grid gap-3 sm:grid-cols-2">{relatedCollections.map((collection) => <Link key={collection.id} href={`/${params.lang}/collections/${collection.slug}`} className="rounded-lg border border-ink-line p-5 text-sm text-parchment hover:border-gold/40">{localized(params.lang, collection.name, collection.nameAr)}</Link>)}</div></section>}
  </main>;
}

