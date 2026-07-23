import { CategoryManager } from '@/components/studio/CatalogManagers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function StudioCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }], include: { _count: { select: { perfumes: true } } },
  });
  return <div className="space-y-6"><div><h1 className="font-display text-2xl text-parchment">Categories</h1><p className="mt-1 text-xs text-smoke">Maintain the bilingual catalog hierarchy, visibility and ordering.</p></div><CategoryManager categories={categories.map((category) => ({ id: category.id, nameEn: category.nameEn, nameAr: category.nameAr, slug: category.slug, status: category.status, sortOrder: category.sortOrder, parentId: category.parentId, descriptionEn: category.descriptionEn, descriptionAr: category.descriptionAr, keywords: category.keywords, ogImage: category.ogImage, productCount: category._count.perfumes }))} /></div>;
}
