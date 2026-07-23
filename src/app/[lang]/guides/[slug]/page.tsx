import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Breadcrumb from '@/components/Breadcrumb';
import { type Locale } from '@/lib/i18n';
import { localized } from '@/utils/localized';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd, serializeJsonLd } from '@/utils/seo';

export const revalidate = 1800;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: { lang: Locale; slug: string } }): Promise<Metadata> {
  const article = await prisma.editorialArticle.findFirst({ where: { slug: params.slug, status: 'PUBLISHED' } });
  if (!article) return {};
  return buildMetadata({
    title: localized(params.lang, article.metaTitleEn ?? article.titleEn ?? article.titleAr, article.metaTitleAr ?? article.titleAr),
    description: localized(params.lang, article.metaDescriptionEn ?? article.excerptEn ?? '', article.metaDescriptionAr ?? article.excerptAr),
    path: `/guides/${article.slug}`, locale: params.lang, image: article.coverImage ?? undefined, keywords: article.keywords,
  });
}

export default async function EditorialGuidePage({ params }: { params: { lang: Locale; slug: string } }) {
  const article = await prisma.editorialArticle.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: { faqs: { orderBy: { position: 'asc' } } },
  });
  if (!article) notFound();
  const ar = params.lang === 'ar';
  const title = localized(params.lang, article.titleEn ?? article.titleAr, article.titleAr);
  const excerpt = localized(params.lang, article.excerptEn ?? '', article.excerptAr);
  const content = localized(params.lang, article.contentEn ?? article.contentAr, article.contentAr);
  const faqItems = article.faqs.map((faq) => ({ question: localized(params.lang, faq.questionEn ?? faq.questionAr, faq.questionAr), answer: localized(params.lang, faq.answerEn ?? faq.answerAr, faq.answerAr) }));
  const path = `/${params.lang}/guides/${article.slug}`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
        '@context': 'https://schema.org', '@type': 'Article', headline: title, description: excerpt,
        image: article.coverImage ?? undefined, datePublished: article.publishedAt?.toISOString(), dateModified: article.updatedAt.toISOString(),
        inLanguage: params.lang, mainEntityOfPage: absoluteUrl(path), author: { '@type': 'Organization', name: 'ScentIQ' }, publisher: { '@type': 'Organization', name: 'ScentIQ' },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd([
        { name: ar ? 'الرئيسية' : 'Home', path: `/${params.lang}` }, { name: ar ? 'أدلة العطور' : 'Perfume guides', path }, { name: title, path },
      ])) }} />
      {faqItems.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd(faqItems)) }} />}
      <Breadcrumb lang={params.lang} items={[{ label: ar ? 'الرئيسية' : 'Home', href: `/${params.lang}` }, { label: ar ? 'أدلة العطور' : 'Perfume guides' }, { label: title }]} />
      <article>
        <p className="eyebrow mb-3">{ar ? 'دليل من ScentIQ' : 'A ScentIQ guide'}</p>
        <h1 className="max-w-4xl font-display text-4xl leading-tight text-parchment md:text-6xl">{title}</h1>
        {excerpt && <p className="mt-6 max-w-3xl text-lg leading-8 text-smoke">{excerpt}</p>}
        {article.coverImage && <div className="relative mt-10 aspect-[16/8] overflow-hidden rounded-sm border border-ink-line"><Image src={article.coverImage} alt={localized(params.lang, article.coverAltEn ?? title, article.coverAltAr ?? title)} fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" /></div>}
        <div className="mx-auto mt-12 max-w-3xl whitespace-pre-line text-base leading-9 text-smoke">{content}</div>
      </article>
      {faqItems.length > 0 && <section className="mx-auto mt-16 max-w-3xl border-t border-ink-line pt-12"><h2 className="font-display text-3xl text-parchment">{ar ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2><div className="mt-6">{faqItems.map((faq) => <details key={faq.question} className="border-b border-ink-line py-5"><summary className="cursor-pointer text-parchment">{faq.question}</summary><p className="mt-3 text-sm leading-7 text-smoke">{faq.answer}</p></details>)}</div></section>}
      <div className="mx-auto mt-14 max-w-3xl border-t border-ink-line pt-8"><Link href={`/${params.lang}/shop`} className="text-sm text-gold-bright">{ar ? 'تصفّح العطور المتوفرة' : 'Browse available perfumes'}</Link></div>
    </main>
  );
}
