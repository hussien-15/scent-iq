import { prisma } from '@/lib/prisma';

export function findSearchCandidates(take = 150) {
  return prisma.perfume.findMany({
    where: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
    take: Math.min(Math.max(take, 1), 200),
    orderBy: [{ popularityScore: 'desc' }, { nameEn: 'asc' }],
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      searchAliases: true,
      keywords: true,
      scentFamilies: true,
      brand: { select: { id: true, name: true, nameAr: true, searchAliases: true } },
      notes: { select: { note: { select: { nameEn: true, nameAr: true } } } },
    },
  });
}

export function findPublishedCheckoutProducts(ids: string[]) {
  return prisma.perfume.findMany({
    where: { id: { in: ids }, status: 'PUBLISHED' },
    include: { variants: true, brand: { select: { name: true, nameAr: true } } },
  });
}

export function findPublishedAvailability(ids: string[]) {
  return prisma.perfume.findMany({
    where: { id: { in: ids }, status: 'PUBLISHED', availability: { not: 'HIDDEN' } },
    select: {
      id: true,
      stock: true,
      reservedStock: true,
      availability: true,
      variants: {
        where: { availability: { not: 'HIDDEN' } },
        select: { id: true, stock: true, reservedStock: true, availability: true },
      },
    },
  });
}
