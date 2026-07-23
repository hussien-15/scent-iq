import CollectionForm from '@/components/studio/CollectionForm';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NewCollectionPage() {
  const [products, brands, notes, collections] = await Promise.all([
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

  return (
    <CollectionForm
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
