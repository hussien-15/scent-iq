import { notFound } from 'next/navigation';
import CollectionForm, { type CollectionEditorData } from '@/components/studio/CollectionForm';
import { prisma } from '@/lib/prisma';
import { parseCollectionRules } from '@/services/collection.service';

export const dynamic = 'force-dynamic';

export default async function EditCollectionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [collection, products, brands, notes, collections] = await Promise.all([
    prisma.collection.findUnique({
      where: { id: params.id },
      include: {
        perfumes: { orderBy: { position: 'asc' } },
        faqs: { orderBy: { position: 'asc' } },
        relatedFrom: { orderBy: { position: 'asc' }, select: { relatedCollectionId: true } },
      },
    }),
    prisma.perfume.findMany({
      orderBy: { nameEn: 'asc' },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        sku: true,
        price: true,
        brand: { select: { name: true } },
      },
    }),
    prisma.brand.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.note.findMany({ orderBy: { nameEn: 'asc' }, select: { id: true, nameEn: true, nameAr: true } }),
    prisma.collection.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!collection) notFound();

  const editorData: CollectionEditorData = {
    id: collection.id,
    name: collection.name,
    nameAr: collection.nameAr,
    slug: collection.slug,
    type: collection.type,
    status: collection.status,
    shortDescription: collection.shortDescription,
    shortDescriptionAr: collection.shortDescriptionAr,
    description: collection.description,
    descriptionAr: collection.descriptionAr,
    buyingGuide: collection.buyingGuide,
    buyingGuideAr: collection.buyingGuideAr,
    coverImage: collection.coverImage,
    coverAlt: collection.coverAlt,
    coverAltAr: collection.coverAltAr,
    manualOrdering: collection.manualOrdering,
    featuredOnHomepage: collection.featuredOnHomepage,
    homepageOrder: collection.homepageOrder,
    scheduledAt: collection.scheduledAt?.toISOString() ?? null,
    metaTitleEn: collection.metaTitleEn,
    metaTitleAr: collection.metaTitleAr,
    metaDescriptionEn: collection.metaDescriptionEn,
    metaDescriptionAr: collection.metaDescriptionAr,
    keywords: collection.keywords,
    ogImage: collection.ogImage,
    rules: parseCollectionRules(collection.rules),
    perfumes: collection.perfumes.map((item) => ({
      perfumeId: item.perfumeId,
      position: item.position,
      pinned: item.pinned,
      featuredLabelEn: item.featuredLabelEn,
      featuredLabelAr: item.featuredLabelAr,
      featuredReasonEn: item.featuredReasonEn,
      featuredReasonAr: item.featuredReasonAr,
    })),
    faqs: collection.faqs.map((faq) => ({
      questionEn: faq.questionEn,
      questionAr: faq.questionAr,
      answerEn: faq.answerEn,
      answerAr: faq.answerAr,
    })),
    relatedCollectionIds: collection.relatedFrom.map((item) => item.relatedCollectionId),
  };

  return (
    <CollectionForm
      collection={editorData}
      products={products.map((product) => ({
        id: product.id,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        sku: product.sku,
        price: product.price.toString(),
        brandName: product.brand.name,
      }))}
      brands={brands}
      notes={notes}
      collections={collections}
    />
  );
}
