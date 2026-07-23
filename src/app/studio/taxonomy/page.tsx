import TaxonomyManager from '@/components/studio/TaxonomyManager';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function TaxonomyPage() {
  const [notes, tags] = await Promise.all([
    prisma.note.findMany({ orderBy: { nameEn: 'asc' }, include: { _count: { select: { perfumeNotes: true, favoritedBy: true } } } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { perfumes: true } } } }),
  ]);
  return <div className="space-y-6"><div><h1 className="font-display text-2xl text-parchment">Notes & Tags</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-smoke">Manage the reusable fragrance vocabulary used by product pages, filters, collections, search and recommendations. In-use records are protected from deletion.</p></div><TaxonomyManager notes={notes.map((note) => ({ id: note.id, nameEn: note.nameEn, nameAr: note.nameAr, slug: note.slug, category: note.category, descriptionEn: note.descriptionEn, descriptionAr: note.descriptionAr, keywords: note.keywords, productCount: note._count.perfumeNotes, favoriteCount: note._count.favoritedBy }))} tags={tags.map((tag) => ({ id: tag.id, name: tag.name, nameEn: tag.nameEn, nameAr: tag.nameAr, slug: tag.slug, type: tag.type, descriptionEn: tag.descriptionEn, descriptionAr: tag.descriptionAr, productCount: tag._count.perfumes }))} /></div>;
}
