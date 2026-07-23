import { notFound } from 'next/navigation';
import ProductForm, { type ProductEditorData } from '@/components/studio/ProductForm';
import { prisma } from '@/lib/prisma';
import { getCompletionScore } from '@/services/product-completion.service';

export const dynamic = 'force-dynamic';

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [product, brands, categories, notes, tags, media] = await Promise.all([
    prisma.perfume.findUnique({
      where: { id: params.id },
      include: {
        notes: { select: { noteId: true, tier: true } },
        tags: { select: { tagId: true } },
        galleryMedia: { orderBy: { sortOrder: 'asc' }, select: { mediaId: true } },
      },
    }),
    prisma.brand.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { nameEn: 'asc' }, select: { id: true, nameEn: true } }),
    prisma.note.findMany({ orderBy: { nameEn: 'asc' }, select: { id: true, nameEn: true, nameAr: true } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, nameAr: true } }),
    prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: 120, select: { id: true, url: true, name: true, type: true } }),
  ]);
  if (!product) notFound();

  const editorData: ProductEditorData = {
    id: product.id, nameEn: product.nameEn, nameAr: product.nameAr, slug: product.slug, sku: product.sku,
    barcode: product.barcode, brandId: product.brandId, categoryId: product.categoryId, status: product.status,
    price: product.price.toString(), oldPrice: product.oldPrice?.toString() ?? null,
    costPrice: product.costPrice?.toString() ?? null, currency: product.currency,
    stock: product.stock, reservedStock: product.reservedStock, lowStockThreshold: product.lowStockThreshold,
    warehouseLocation: product.warehouseLocation, shortDescriptionEn: product.shortDescriptionEn,
    shortDescriptionAr: product.shortDescriptionAr, descriptionEn: product.descriptionEn,
    descriptionAr: product.descriptionAr, storyEn: product.storyEn, storyAr: product.storyAr,
    concentration: product.concentration, gender: product.gender, bottleSize: product.bottleSize,
    releaseYear: product.releaseYear, countryOfOrigin: product.countryOfOrigin, scentFamilies: product.scentFamilies,
    longevity: product.longevity, projection: product.projection, sillage: product.sillage,
    season: product.season, occasion: product.occasion, style: product.style, mood: product.mood,
    metaTitleEn: product.metaTitleEn, metaTitleAr: product.metaTitleAr,
    metaDescriptionEn: product.metaDescriptionEn, metaDescriptionAr: product.metaDescriptionAr,
    keywords: product.keywords, searchAliases: product.searchAliases, ogImage: product.ogImage,
    canonicalUrl: product.canonicalUrl, mainImageId: product.mainImageId, videoId: product.videoId,
    notes: product.notes.map((item) => ({ noteId: item.noteId, tier: item.tier })),
    tagIds: product.tags.map((item) => item.tagId), galleryMediaIds: product.galleryMedia.map((item) => item.mediaId),
  };
  const completion = getCompletionScore({ ...product, media: product.galleryMedia, notes: product.notes, tags: product.tags });
  return <ProductForm product={editorData} brands={brands} categories={categories} notes={notes} tags={tags} media={media} completion={completion} />;
}
