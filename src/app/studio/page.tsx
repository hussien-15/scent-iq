import Link from 'next/link';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Tag,
  Users,
  AlertTriangle,
  Star,
  Eye,
  TrendingUp,
  Search,
  Sparkles,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import StatCard from '@/components/studio/StatCard';
import { parseStoreLaunch } from '@/services/store-setup.service';

export const dynamic = 'force-dynamic';

export default async function StudioDashboard() {
  const launchSetting = await prisma.siteSetting.findUnique({
    where: { key: 'store.launch' },
    select: { value: true },
  });
  const launchStatus = parseStoreLaunch(launchSetting?.value);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

  const [
    todaysOrders,
    todaysRevenue,
    monthlyRevenue,
    weeklyRevenue,
    productCount,
    brandCount,
    customerCount,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    allProductsForStock,
    recentReviews,
    recentActivity,
    topSelling,
    mostViewed,
    topSearches,
    inventoryAlerts,
    fastInventoryMovements,
    noResultSearches,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfToday }, status: { in: ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: { in: ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfWeek }, status: { in: ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
      _sum: { total: true },
    }),
    prisma.perfume.count(),
    prisma.brand.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.perfume.findMany({
      select: {
        id: true,
        nameEn: true,
        stock: true,
        reservedStock: true,
        availableStock: true,
        lowStockThreshold: true,
        inventoryStatus: true,
        viewCount: true,
        purchaseCount: true,
      },
    }),
    prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, perfume: { select: { nameEn: true } } },
    }),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true } } },
    }),
    prisma.perfume.findMany({
      take: 5,
      orderBy: { purchaseCount: 'desc' },
      select: { id: true, nameEn: true, purchaseCount: true },
    }),
    prisma.perfume.findMany({
      take: 5,
      orderBy: { viewCount: 'desc' },
      select: { id: true, nameEn: true, viewCount: true },
    }),
    prisma.searchLog.groupBy({
      by: ['keyword'],
      _count: { keyword: true },
      orderBy: { _count: { keyword: 'desc' } },
      take: 5,
    }),
    prisma.inventoryNotification.findMany({
      where: { resolvedAt: null },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, message: true },
    }),
    prisma.inventoryMovement.findMany({
      where: { movementType: 'ORDER_SHIPPED', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { perfumeId: true, quantityChanged: true, perfume: { select: { nameEn: true } } },
      take: 1000,
    }),
    prisma.searchLog.groupBy({
      by: ['keyword'],
      where: { resultsCount: 0, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      _count: { keyword: true },
      orderBy: { _count: { keyword: 'desc' } },
      take: 3,
    }),
  ]);

  const lowStockProducts = (
    allProductsForStock as {
      id: string;
      nameEn: string;
      stock: number;
      reservedStock: number;
      availableStock: number;
      lowStockThreshold: number;
      inventoryStatus: string;
      viewCount: number;
      purchaseCount: number;
    }[]
  )
    .filter((p) => ['LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED'].includes(p.inventoryStatus))
    .slice(0, 5);
  const fastInventory = [
    ...fastInventoryMovements
      .reduce((map, movement) => {
        const current = map.get(movement.perfumeId) ?? {
          id: movement.perfumeId,
          name: movement.perfume.nameEn,
          units: 0,
        };
        current.units += Math.abs(movement.quantityChanged);
        map.set(movement.perfumeId, current);
        return map;
      }, new Map<string, { id: string; name: string; units: number }>())
      .values(),
  ]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);
  const smartInsights = [
    ...allProductsForStock
      .filter((product) => product.inventoryStatus === 'OUT_OF_STOCK' && product.viewCount >= 5)
      .slice(0, 2)
      .map((product) => ({
        priority: 'CRITICAL',
        title: `${product.nameEn} is out of stock with demand`,
        detail: `${product.viewCount} recorded views. Restock or show alternatives.`,
        href: `/studio/inventory?q=${encodeURIComponent(product.nameEn)}`,
      })),
    ...allProductsForStock
      .filter((product) => product.viewCount >= 10 && product.purchaseCount === 0)
      .slice(0, 2)
      .map((product) => ({
        priority: 'HIGH',
        title: `${product.nameEn} has views but no shipped sales`,
        detail: 'Review price, imagery, product copy, and delivery clarity.',
        href: `/studio/products?q=${encodeURIComponent(product.nameEn)}`,
      })),
    ...noResultSearches.map((search) => ({
      priority: 'HIGH',
      title: `Customers cannot find “${search.keyword}”`,
      detail: `${search._count.keyword} no-result searches in 30 days. Add an alias, product, or alternative.`,
      href: `/studio/products?q=${encodeURIComponent(search.keyword)}`,
    })),
  ].slice(0, 4);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-parchment">Dashboard</h1>

      {launchStatus !== 'LIVE' && (
        <Link
          href="/studio/setup"
          className="flex items-start gap-3 rounded-xl border border-gold/25 bg-gold/[0.04] p-4"
        >
          <Sparkles size={17} className="mt-0.5 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-parchment">Continue store setup</p>
            <p className="mt-1 text-xs leading-5 text-smoke">
              ScentIQ is in {launchStatus.toLowerCase()} mode. Complete the launch checklist, real catalog, approved
              media, delivery fees, and SEO before going live.
            </p>
          </div>
          <span className="shrink-0 text-xs text-gold-bright">Open setup →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Today's orders" value={todaysOrders} icon={ShoppingCart} />
        <StatCard label="Today's revenue" value={`$${(todaysRevenue._sum.total ?? 0).toString()}`} icon={DollarSign} />
        <StatCard
          label="Monthly revenue"
          value={`$${(monthlyRevenue._sum.total ?? 0).toString()}`}
          icon={DollarSign}
          accent
        />
        <StatCard
          label="Last 7 days revenue"
          value={`$${(weeklyRevenue._sum.total ?? 0).toString()}`}
          icon={DollarSign}
        />
        <StatCard label="Products" value={productCount} icon={Package} />
        <StatCard label="Brands" value={brandCount} icon={Tag} />
        <StatCard label="Customers" value={customerCount} icon={Users} />
        <StatCard label="Pending orders" value={pendingOrders} icon={ShoppingCart} />
        <StatCard label="Delivered orders" value={deliveredOrders} icon={ShoppingCart} />
      </div>

      {inventoryAlerts.length > 0 && (
        <Link href="/studio/inventory" className="block rounded-lg border border-amber-300/20 bg-amber-300/[0.03] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5 text-amber-200" />
            <div>
              <p className="text-sm text-parchment">{inventoryAlerts[0].title}</p>
              <p className="mt-1 text-xs text-smoke">
                {inventoryAlerts[0].message}
                {inventoryAlerts.length > 1 ? ` · ${inventoryAlerts.length - 1} more inventory alert(s)` : ''}
              </p>
            </div>
          </div>
        </Link>
      )}

      <section className="rounded-lg border border-white/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Rule-based business intelligence</p>
            <h2 className="font-display text-xl text-parchment">Priority insights</h2>
          </div>
          <Link href="/studio/analytics" className="text-xs text-studioBlue hover:underline">
            Open full analytics
          </Link>
        </div>
        {smartInsights.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {smartInsights.map((insight) => (
              <Link
                key={insight.title}
                href={insight.href}
                className="rounded-md border border-white/10 bg-white/[0.02] p-3 hover:border-gold/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-parchment">{insight.title}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-[8px] ${insight.priority === 'CRITICAL' ? 'bg-red-400/10 text-red-200' : 'bg-amber-300/10 text-amber-100'}`}
                  >
                    {insight.priority}
                  </span>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-smoke">{insight.detail}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-smoke">No urgent insight has crossed its evidence threshold yet.</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-gold" />
            <h2 className="text-sm text-parchment">Low stock products</h2>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-smoke">Nothing running low right now.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex justify-between text-smoke">
                  <span className="text-parchment">{p.nameEn}</span>
                  <span>
                    {p.availableStock} available · {p.reservedStock} reserved
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-300" />
            <h2 className="text-sm text-parchment">Fast moving this week</h2>
          </div>
          {fastInventory.length === 0 ? (
            <p className="text-xs text-smoke">No shipped stock movements yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {fastInventory.map((item) => (
                <li key={item.id} className="flex justify-between text-smoke">
                  <span className="text-parchment">{item.name}</span>
                  <span>{item.units} units shipped</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Star size={15} className="text-gold" />
            <h2 className="text-sm text-parchment">Recent reviews</h2>
          </div>
          {recentReviews.length === 0 ? (
            <p className="text-xs text-smoke">No reviews yet.</p>
          ) : (
            <ul className="space-y-3 text-xs">
              {recentReviews.map(
                (r: {
                  id: string;
                  rating: number;
                  reviewerName: string | null;
                  user: { name: string | null } | null;
                  perfume: { nameEn: string };
                }) => (
                  <li key={r.id} className="flex justify-between text-smoke">
                    <span>
                      <span className="text-parchment">{r.reviewerName || r.user?.name || 'Guest'}</span> on{' '}
                      {r.perfume.nameEn}
                    </span>
                    <span className="text-gold-bright">{r.rating}★</span>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-studioBlue" />
            <h2 className="text-sm text-parchment">Top selling perfumes</h2>
          </div>
          <ul className="space-y-2 text-xs">
            {topSelling.map((p: { id: string; nameEn: string; purchaseCount: number }) => (
              <li key={p.id} className="flex justify-between text-smoke">
                <span className="text-parchment">{p.nameEn}</span>
                <span>{p.purchaseCount}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-smoke/60">Ranked from confirmed shipped inventory activity.</p>
        </div>

        <div className="rounded-lg border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Eye size={15} className="text-studioBlue" />
            <h2 className="text-sm text-parchment">Most viewed perfumes</h2>
          </div>
          <ul className="space-y-2 text-xs">
            {mostViewed.map((p: { id: string; nameEn: string; viewCount: number }) => (
              <li key={p.id} className="flex justify-between text-smoke">
                <span className="text-parchment">{p.nameEn}</span>
                <span>{p.viewCount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-white/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Search size={15} className="text-studioBlue" />
            <h2 className="text-sm text-parchment">Most searched keywords</h2>
          </div>
          {topSearches.length === 0 ? (
            <p className="text-xs text-smoke">No searches logged yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {topSearches.map((s: { keyword: string; _count: { keyword: number } }) => (
                <li key={s.keyword} className="flex justify-between text-smoke">
                  <span className="text-parchment">{s.keyword}</span>
                  <span>{s._count.keyword}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-white/10 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm text-parchment">Recent activity</h2>
            <Link href="/studio/activity" className="text-[11px] text-studioBlue hover:underline">
              View all
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-xs text-smoke">No activity logged yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {recentActivity.map(
                (a: {
                  id: string;
                  action: string;
                  affectedName: string;
                  actorName: string | null;
                  admin: { name: string | null } | null;
                }) => (
                  <li key={a.id} className="text-smoke">
                    <span className="text-parchment">{a.admin?.name ?? a.actorName ?? 'System'}</span> — {a.action} —{' '}
                    {a.affectedName}
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 p-5 text-xs text-smoke">
        Cancelled orders: {cancelledOrders} · Revenue cards exclude cancelled and returned orders.
      </div>
    </div>
  );
}
