import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Breadcrumb from '@/components/Breadcrumb';
import ProductCard from '@/components/ProductCard';
import { getDictionary, resolveLocale } from '@/lib/i18n';
import { localized } from '@/utils/localized';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd, serializeJsonLd } from '@/utils/seo';

export const revalidate = 900;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

export async function generateMetadata(props: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const note = await prisma.note.findUnique({ where: { slug: params.slug } });
  if (!note) return {};
  const ar = params.lang === 'ar';
  const name = localized(params.lang, note.nameEn, note.nameAr);
  return buildMetadata({ title: (ar ? note.metaTitleAr : note.metaTitleEn) ?? (ar ? `عطور ${name} المتوفرة في العراق` : `${name} Perfumes in Iraq`), description: (ar ? note.metaDescriptionAr : note.metaDescriptionEn) ?? localized(params.lang, note.descriptionEn ?? `Explore perfumes featuring ${note.nameEn}.`, note.descriptionAr ?? `اكتشف العطور التي تحتوي على نوتة ${note.nameAr} وقارن الروائح والاستخدامات قبل الاختيار.`), path: `/notes/${note.slug}`, locale: params.lang, image: note.ogImage ?? undefined, keywords: note.keywords });
}

export default async function NotePage(props: { params: Promise<{ lang: string; slug: string }> }) {
  const rawParams = await props.params;
  const params = { ...rawParams, lang: resolveLocale(rawParams.lang) };
  const note = await prisma.note.findUnique({ where: { slug: params.slug }, include: { faqs: { orderBy: { position: 'asc' } }, perfumeNotes: { where: { perfume: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } } }, include: { perfume: { include: { brand: { select: { name: true, nameAr: true } } } } } } } });
  if (!note) notFound();
  const relatedNotes = await prisma.note.findMany({ where: { id: { not: note.id }, category: note.category, perfumeNotes: { some: { perfume: { status: 'PUBLISHED' } } } }, take: 8, orderBy: { nameAr: 'asc' } });
  const dict = getDictionary(params.lang);const name = localized(params.lang, note.nameEn, note.nameAr);
  const description = localized(params.lang, note.descriptionEn ?? `Perfumes where ${note.nameEn} is part of the scent profile.`, note.descriptionAr ?? `مجموعة عطور تدخل فيها نوتة ${note.nameAr} ضمن التكوين العطري، مع خيارات مختلفة للمواسم والمناسبات.`);
  const perfumes = note.perfumeNotes.map((entry) => entry.perfume);
  const faqs = note.faqs.map((faq) => ({ question: localized(params.lang, faq.questionEn ?? faq.questionAr, faq.questionAr), answer: localized(params.lang, faq.answerEn ?? faq.answerAr, faq.answerAr) }));
  const breadcrumbs = [{ name: dict.product.breadcrumbHome, path: `/${params.lang}` }, { name, path: `/${params.lang}/notes/${note.slug}` }];
  return <main className="mx-auto max-w-6xl px-6 py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd(breadcrumbs)) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({ '@context': 'https://schema.org', '@type': 'CollectionPage', name, description, url: absoluteUrl(`/${params.lang}/notes/${note.slug}`), mainEntity: { '@type': 'ItemList', numberOfItems: perfumes.length, itemListElement: perfumes.map((perfume, index) => ({ '@type': 'ListItem', position: index + 1, name: localized(params.lang, perfume.nameEn, perfume.nameAr), url: absoluteUrl(`/${params.lang}/product/${perfume.slug}`) })) } }) }} />
    {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd(faqs)) }} />}
    <Breadcrumb lang={params.lang} items={[{ label: dict.product.breadcrumbHome, href: `/${params.lang}` }, { label: name }]} />
    <header className="mx-auto max-w-3xl text-center"><p className="eyebrow mb-3">{params.lang === 'ar' ? 'دليل النوتات العطرية' : 'Fragrance note guide'}</p><h1 className="font-display text-4xl text-parchment md:text-5xl">{params.lang === 'ar' ? `عطور ${name}` : `${name} perfumes`}</h1><p className="mt-5 text-sm leading-8 text-smoke">{description}</p></header>
    <section className="mt-14"><div className="mb-6 flex justify-between"><h2 className="font-display text-2xl text-parchment">{params.lang === 'ar' ? 'عطور تحتوي على هذه النوتة' : 'Perfumes with this note'}</h2><span className="text-xs text-smoke">{perfumes.length}</span></div>{perfumes.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{perfumes.map((perfume) => <ProductCard key={perfume.id} product={perfume} lang={params.lang} />)}</div> : <p className="text-center text-sm text-smoke">{params.lang === 'ar' ? 'لا توجد منتجات منشورة لهذه النوتة حاليًا.' : 'No published products use this note yet.'}</p>}</section>
    {faqs.length > 0 && <section className="mx-auto mt-16 max-w-3xl border-t border-ink-line pt-12"><h2 className="mb-5 font-display text-2xl text-parchment">{params.lang === 'ar' ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2>{faqs.map((faq) => <details key={faq.question} className="border-b border-ink-line py-4"><summary className="cursor-pointer text-sm text-parchment">{faq.question}</summary><p className="mt-3 text-sm leading-7 text-smoke">{faq.answer}</p></details>)}</section>}
    {relatedNotes.length > 0 && <section className="mt-16 border-t border-ink-line pt-12"><h2 className="mb-5 font-display text-2xl text-parchment">{params.lang === 'ar' ? 'نوتات مرتبطة' : 'Related fragrance notes'}</h2><div className="flex flex-wrap gap-2">{relatedNotes.map((item) => <Link key={item.id} href={`/${params.lang}/notes/${item.slug}`} className="rounded-full border border-ink-line px-4 py-2 text-xs text-smoke hover:border-gold/40 hover:text-parchment">{localized(params.lang, item.nameEn, item.nameAr)}</Link>)}</div></section>}
  </main>;
}

