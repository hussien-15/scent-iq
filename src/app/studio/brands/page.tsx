import { BrandManager } from '@/components/studio/CatalogManagers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function StudioBrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { deletedAt: null }, orderBy: { name: 'asc' }, include: { _count: { select: { perfumes: true } } },
  });
  return <div className="space-y-6"><div><h1 className="font-display text-2xl text-parchment">Brands</h1><p className="mt-1 text-xs text-smoke">Create, edit, feature or safely archive perfume houses without changing code.</p></div><BrandManager brands={brands.map((brand) => ({ id: brand.id, name: brand.name, nameAr: brand.nameAr, slug: brand.slug, originCountry: brand.originCountry, foundedYear: brand.foundedYear, status: brand.status, isFeatured: brand.isFeatured, descriptionEn: brand.descriptionEn, descriptionAr: brand.descriptionAr, logoUrl: brand.logoUrl, website: brand.website, characteristics: brand.characteristics, searchAliases: brand.searchAliases, productCount: brand._count.perfumes }))} /></div>;
}
