import ProductForm from '@/components/studio/ProductForm';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const [brands, categories, notes, tags, media] = await Promise.all([
    prisma.brand.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { nameEn: 'asc' }, select: { id: true, nameEn: true } }),
    prisma.note.findMany({ orderBy: { nameEn: 'asc' }, select: { id: true, nameEn: true, nameAr: true } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, nameAr: true } }),
    prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: 120, select: { id: true, url: true, name: true, type: true } }),
  ]);
  return <ProductForm brands={brands} categories={categories} notes={notes} tags={tags} media={media} />;
}
