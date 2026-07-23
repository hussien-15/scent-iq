import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { countCollectionProducts } from '@/services/collection.service';

export const dynamic = 'force-dynamic';

export default async function StudioCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      perfumes: {
        select: {
          perfumeId: true,
          position: true,
          pinned: true,
          featuredLabelEn: true,
          featuredLabelAr: true,
          featuredReasonEn: true,
          featuredReasonAr: true,
        },
      },
      analytics: {
        where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { views: true, addToCarts: true, purchases: true, revenue: true },
      },
    },
  });
  const collectionIds = collections.map((collection) => collection.id);
  const [productCounts, clickGroups, lowStockPins] = await Promise.all([
    Promise.all(collections.map((collection) => countCollectionProducts(collection))),
    prisma.collectionInteraction.groupBy({
      by: ['collectionId', 'perfumeId'],
      where: { collectionId: { in: collectionIds }, actionType: 'PRODUCT_CLICK', perfumeId: { not: null } },
      _count: { perfumeId: true },
    }),
    prisma.collectionProduct.findMany({
      where: { collectionId: { in: collectionIds }, pinned: true, perfume: { stock: { lte: 10 } } },
      select: { collectionId: true, perfume: { select: { nameEn: true, stock: true } } },
    }),
  ]);
  const clickedPerfumeIds = clickGroups.map((group) => group.perfumeId).filter(Boolean) as string[];
  const clickedPerfumes = clickedPerfumeIds.length
    ? await prisma.perfume.findMany({ where: { id: { in: clickedPerfumeIds } }, select: { id: true, nameEn: true } })
    : [];
  const perfumeNames = new Map(clickedPerfumes.map((perfume) => [perfume.id, perfume.nameEn]));
  const topClicked = new Map<string, { name: string; clicks: number }>();
  clickGroups.forEach((group) => {
    if (!group.perfumeId) return;
    const clicks = group._count.perfumeId;
    if (clicks > (topClicked.get(group.collectionId)?.clicks ?? -1)) {
      topClicked.set(group.collectionId, { name: perfumeNames.get(group.perfumeId) ?? 'Unknown', clicks });
    }
  });
  const metrics = collections.map((collection) => {
    const totals = collection.analytics.reduce(
      (sum, day) => ({
        views: sum.views + day.views,
        carts: sum.carts + day.addToCarts,
        purchases: sum.purchases + day.purchases,
        revenue: sum.revenue + Number(day.revenue),
      }),
      { views: 0, carts: 0, purchases: 0, revenue: 0 }
    );
    return {
      ...totals,
      conversion: totals.views ? (totals.purchases / totals.views) * 100 : 0,
    };
  });
  const highestRevenueIndex = metrics.reduce(
    (best, metric, index) => (metric.revenue > (metrics[best]?.revenue ?? -1) ? index : best),
    0
  );
  const needsAttentionIndex = metrics.findIndex((metric) => metric.views >= 10 && metric.conversion < 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-parchment">Collections</h1>
          <p className="mt-1 text-xs text-smoke">Editorial guides, dynamic catalog rules, and collection performance.</p>
        </div>
        <Link href="/studio/collections/new" className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-gold-bright">
          + Create collection
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-start text-xs">
          <thead className="border-b border-white/10 text-smoke">
            <tr>
              <th className="p-3 font-normal">Name</th>
              <th className="p-3 font-normal">Description</th>
              <th className="p-3 font-normal">Type</th>
              <th className="p-3 font-normal">Products</th>
              <th className="p-3 font-normal">30d views</th>
              <th className="p-3 font-normal">Conversion</th>
              <th className="p-3 font-normal">Revenue</th>
              <th className="p-3 font-normal">Top clicked</th>
              <th className="p-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c, index) => {
              const totals = metrics[index];
              return (
                <tr key={c.id} className="border-b border-white/5 last:border-0">
                  <td className="p-3 text-parchment"><Link href={`/studio/collections/${c.id}`} className="hover:text-studioBlue">{c.name}</Link></td>
                  <td className="max-w-xs truncate p-3 text-smoke">{c.shortDescription ?? c.description ?? '—'}</td>
                  <td className="p-3 text-smoke">{c.type}</td>
                  <td className="p-3 text-smoke">{productCounts[index]}</td>
                  <td className="p-3 text-smoke">{totals.views}</td>
                  <td className="p-3 text-smoke">{totals.conversion.toFixed(1)}%</td>
                  <td className="p-3 text-smoke">${totals.revenue.toFixed(2)}</td>
                  <td className="max-w-36 truncate p-3 text-smoke">{topClicked.get(c.id)?.name ?? '—'}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] ${c.status === 'PUBLISHED' ? 'bg-emerald-400/10 text-emerald-300' : c.status === 'SCHEDULED' ? 'bg-studioBlue/10 text-studioBlue' : 'bg-white/5 text-smoke'}`}>{c.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 p-4"><p className="text-xs text-smoke">Conversion insight</p><p className="mt-2 text-sm text-parchment">{needsAttentionIndex >= 0 ? `${collections[needsAttentionIndex].name} has solid traffic but converts below 1%. Review its featured picks and buying guide.` : 'No high-traffic collection currently shows a critical conversion warning.'}</p></div>
        <div className="rounded-lg border border-white/10 p-4"><p className="text-xs text-smoke">Stock watch</p><p className="mt-2 text-sm text-parchment">{lowStockPins.length ? `${lowStockPins[0].perfume.nameEn} is pinned with only ${lowStockPins[0].perfume.stock} left. ${lowStockPins.length > 1 ? `Plus ${lowStockPins.length - 1} more alert(s).` : ''}` : 'All pinned collection products have healthy stock.'}</p></div>
        <div className="rounded-lg border border-white/10 p-4"><p className="text-xs text-smoke">Revenue leader</p><p className="mt-2 text-sm text-parchment">{collections.length && metrics[highestRevenueIndex].revenue > 0 ? `${collections[highestRevenueIndex].name} leads the last 30 days with $${metrics[highestRevenueIndex].revenue.toFixed(2)} attributed revenue.` : 'Attributed collection revenue will appear after customers order from collection pages.'}</p></div>
      </div>
    </div>
  );
}
