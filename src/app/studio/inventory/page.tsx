import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, CircleDollarSign, PackageCheck, PackageX, RotateCcw, ShoppingCart } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import InventoryManager from '@/components/studio/InventoryManager';
import ResolveInventoryAlert from '@/components/studio/ResolveInventoryAlert';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function StudioInventoryPage(
  props: {
    searchParams: Promise<{ q?: string; status?: string; brand?: string; category?: string; minPrice?: string; maxPrice?: string; minStock?: string; maxStock?: string; page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const validStatuses = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED', 'HIDDEN', 'DISCONTINUED'];
  const where: Prisma.PerfumeWhereInput = {
    ...(searchParams.q ? { OR: [
      { nameEn: { contains: searchParams.q, mode: 'insensitive' } }, { nameAr: { contains: searchParams.q, mode: 'insensitive' } },
      { sku: { contains: searchParams.q, mode: 'insensitive' } }, { barcode: { contains: searchParams.q, mode: 'insensitive' } },
      { brand: { name: { contains: searchParams.q, mode: 'insensitive' } } },
      { notes: { some: { note: { OR: [{ nameEn: { contains: searchParams.q, mode: 'insensitive' } }, { nameAr: { contains: searchParams.q, mode: 'insensitive' } }] } } } },
      { tags: { some: { tag: { name: { contains: searchParams.q, mode: 'insensitive' } } } } },
    ] } : {}),
    ...(validStatuses.includes(searchParams.status ?? '') ? { inventoryStatus: searchParams.status as 'IN_STOCK' } : {}),
    ...(searchParams.brand ? { brandId: searchParams.brand } : {}),
    ...(searchParams.category ? { categoryId: searchParams.category } : {}),
    ...((searchParams.minPrice || searchParams.maxPrice) ? { price: { ...(searchParams.minPrice ? { gte: Number(searchParams.minPrice) } : {}), ...(searchParams.maxPrice ? { lte: Number(searchParams.maxPrice) } : {}) } } : {}),
    ...((searchParams.minStock || searchParams.maxStock) ? { availableStock: { ...(searchParams.minStock ? { gte: Number(searchParams.minStock) } : {}), ...(searchParams.maxStock ? { lte: Number(searchParams.maxStock) } : {}) } } : {}),
  };
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const monthAgo = new Date(Date.now() - 30 * 86400000);

  const [products, total, allStock, brands, categories, alerts, fastGroups, recentShipments, returnCount, cancelledImpact, searchGroups] = await Promise.all([
    prisma.perfume.findMany({
      where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      orderBy: [{ inventoryStatus: 'asc' }, { availableStock: 'asc' }, { updatedAt: 'desc' }],
      include: {
        brand: { select: { name: true } }, category: { select: { nameEn: true } },
        media: { where: { isPrimary: true }, take: 1, select: { url: true } },
        variants: { orderBy: { bottleSize: 'asc' } },
        inventoryMovements: { take: 10, orderBy: { createdAt: 'desc' }, include: { admin: { select: { name: true } }, variant: { select: { name: true } } } },
      },
    }),
    prisma.perfume.count({ where }),
    prisma.perfume.findMany({ select: { id: true, nameEn: true, slug: true, stock: true, reservedStock: true, availableStock: true, lowStockThreshold: true, inventoryStatus: true, price: true, costPrice: true, viewCount: true, purchaseCount: true, wishlistCount: true, brand: { select: { name: true } }, category: { select: { nameEn: true } }, variants: { select: { stock: true, reservedStock: true, availableStock: true, price: true, costPrice: true } } } }),
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ select: { id: true, nameEn: true }, orderBy: { nameEn: 'asc' } }),
    prisma.inventoryNotification.findMany({ where: { resolvedAt: null }, take: 8, orderBy: { createdAt: 'desc' }, include: { perfume: { select: { nameEn: true } } } }),
    prisma.inventoryMovement.groupBy({ by: ['perfumeId'], where: { movementType: 'ORDER_SHIPPED', createdAt: { gte: weekAgo } }, _sum: { quantityChanged: true } }),
    prisma.inventoryMovement.findMany({ where: { movementType: 'ORDER_SHIPPED', createdAt: { gte: monthAgo } }, select: { perfumeId: true } }),
    prisma.inventoryMovement.count({ where: { movementType: 'ORDER_RETURNED', createdAt: { gte: monthAgo } } }),
    prisma.inventoryMovement.aggregate({ where: { movementType: 'ORDER_CANCELLED', createdAt: { gte: monthAgo } }, _sum: { quantityChanged: true } }),
    prisma.searchLog.groupBy({ by: ['clickedPerfumeId'], where: { clickedPerfumeId: { not: null }, createdAt: { gte: monthAgo } }, _count: { clickedPerfumeId: true } }),
  ]);

  const fastMap = new Map(fastGroups.map((group) => [group.perfumeId, Math.abs(group._sum.quantityChanged ?? 0)]));
  const searchMap = new Map(searchGroups.filter((group) => group.clickedPerfumeId).map((group) => [group.clickedPerfumeId!, group._count.clickedPerfumeId]));
  const soldRecently = new Set(recentShipments.map((movement) => movement.perfumeId));
  const fastMoving = allStock.filter((product) => fastMap.has(product.id)).sort((a, b) => (fastMap.get(b.id) ?? 0) - (fastMap.get(a.id) ?? 0)).slice(0, 5);
  const slowMoving = allStock.filter((product) => product.availableStock > Math.max(10, product.lowStockThreshold * 2) && !soldRecently.has(product.id)).sort((a, b) => b.availableStock - a.availableStock || b.viewCount - a.viewCount).slice(0, 5);
  const restock = allStock.map((product) => ({ product, score: (['LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED'].includes(product.inventoryStatus) ? 60 : 0) + (fastMap.get(product.id) ?? 0) * 12 + (searchMap.get(product.id) ?? 0) * 5 + product.wishlistCount * 3 + Math.min(30, product.viewCount / 10) })).filter((item) => item.score >= 60).sort((a, b) => b.score - a.score).slice(0, 5);

  const physicalUnits = allStock.reduce((sum, product) => sum + product.stock + product.variants.reduce((variantSum, variant) => variantSum + variant.stock, 0), 0);
  const reservedUnits = allStock.reduce((sum, product) => sum + product.reservedStock + product.variants.reduce((variantSum, variant) => variantSum + variant.reservedStock, 0), 0);
  const sellingValue = allStock.reduce((sum, product) => sum + product.availableStock * Number(product.price) + product.variants.reduce((variantSum, variant) => variantSum + variant.availableStock * Number(variant.price), 0), 0);
  const costValue = allStock.reduce((sum, product) => sum + product.availableStock * Number(product.costPrice ?? 0) + product.variants.reduce((variantSum, variant) => variantSum + variant.availableStock * Number(variant.costPrice ?? 0), 0), 0);
  const brandValues = [...allStock.reduce((map, product) => {
    const value = product.availableStock * Number(product.price) + product.variants.reduce((sum, variant) => sum + variant.availableStock * Number(variant.price), 0);
    map.set(product.brand.name, (map.get(product.brand.name) ?? 0) + value); return map;
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const categoryValues = [...allStock.reduce((map, product) => {
    const key = product.category?.nameEn ?? 'Uncategorized';
    const value = product.availableStock * Number(product.price) + product.variants.reduce((sum, variant) => sum + variant.availableStock * Number(variant.price), 0);
    map.set(key, (map.get(key) ?? 0) + value); return map;
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const metricCards = [
    { icon: Boxes, label: 'Total products', value: allStock.length },
    { icon: PackageCheck, label: 'Physical units', value: physicalUnits },
    { icon: ShoppingCart, label: 'Reserved units', value: reservedUnits },
    { icon: AlertTriangle, label: 'Low stock', value: allStock.filter((product) => product.inventoryStatus === 'LOW_STOCK').length },
    { icon: PackageX, label: 'Out of stock', value: allStock.filter((product) => ['OUT_OF_STOCK', 'RESERVED'].includes(product.inventoryStatus)).length },
    { icon: CircleDollarSign, label: 'Selling value', value: `$${sellingValue.toFixed(0)}` },
    { icon: CircleDollarSign, label: 'Cost value', value: `$${costValue.toFixed(0)}` },
    { icon: ArrowUpRight, label: 'Potential profit', value: `$${Math.max(0, sellingValue - costValue).toFixed(0)}` },
    { icon: RotateCcw, label: 'Returns · 30 days', value: returnCount },
  ];

  const baseQuery = new URLSearchParams(Object.entries(searchParams).filter(([key, value]) => key !== 'page' && value) as [string, string][]);
  const productData = products.map((product) => ({
    id: product.id, nameEn: product.nameEn, nameAr: product.nameAr, slug: product.slug, sku: product.sku,
    barcode: product.barcode, bottleSize: product.bottleSize, warehouseLocation: product.warehouseLocation,
    stock: product.stock, reservedStock: product.reservedStock, available: product.availableStock,
    lowStockThreshold: product.lowStockThreshold, availability: product.availability, status: product.inventoryStatus,
    updatedAt: product.inventoryUpdatedAt.toISOString(), price: Number(product.price), costPrice: product.costPrice == null ? null : Number(product.costPrice),
    brand: product.brand.name, category: product.category?.nameEn ?? null, image: product.media[0]?.url ?? null,
    variants: product.variants.map((variant) => ({
      id: variant.id, name: variant.name, bottleSize: variant.bottleSize, sku: variant.sku,
      barcode: variant.barcode, price: Number(variant.price), costPrice: variant.costPrice == null ? null : Number(variant.costPrice),
      stock: variant.stock, reservedStock: variant.reservedStock, available: variant.availableStock,
      lowStockThreshold: variant.lowStockThreshold, availability: variant.availability,
      status: variant.inventoryStatus, warehouseLocation: variant.warehouseLocation,
    })),
    movements: product.inventoryMovements.map((movement) => ({
      id: movement.id, movementType: movement.movementType, quantityChanged: movement.quantityChanged,
      previousStock: movement.previousStock, newStock: movement.newStock, previousReserved: movement.previousReserved,
      newReserved: movement.newReserved, reason: movement.reason, adminNote: movement.adminNote,
      createdAt: movement.createdAt.toISOString(), adminName: movement.admin?.name ?? null,
      orderId: movement.orderId, variantName: movement.variant?.name ?? null,
    })),
  }));

  return (
    <div className="space-y-7">
      <div><p className="eyebrow mb-1">Operations & stock accuracy</p><h1 className="font-display text-3xl text-parchment">Inventory Manager</h1><p className="mt-2 text-xs text-smoke">Available stock is always physical stock minus quantities reserved for active COD orders.</p></div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">{metricCards.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-lg border border-white/10 bg-white/[0.02] p-3"><Icon size={15} className="text-gold" /><p className="mt-3 font-display text-xl text-parchment">{value}</p><p className="mt-1 text-[10px] text-smoke">{label}</p></div>)}</div>

      {alerts.length > 0 && <section className="rounded-lg border border-amber-300/20 bg-amber-300/[0.03] p-4"><h2 className="flex items-center gap-2 text-sm text-parchment"><AlertTriangle size={15} className="text-amber-200" />Inventory notifications</h2><div className="mt-3 grid gap-2 md:grid-cols-2">{alerts.map((alert) => <div key={alert.id} className="flex items-start gap-3 rounded-md border border-white/10 p-3"><div className="min-w-0 flex-1"><p className="text-xs text-parchment">{alert.title}</p><p className="mt-1 text-[10px] text-smoke">{alert.message}</p></div><ResolveInventoryAlert notificationId={alert.id} /></div>)}</div></section>}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-white/10 p-4"><h2 className="flex items-center gap-2 text-sm text-parchment"><ArrowUpRight size={15} className="text-emerald-300" />Fast moving this week</h2><ul className="mt-3 space-y-2 text-xs">{fastMoving.map((product) => <li key={product.id} className="flex justify-between text-smoke"><span className="text-parchment">{product.nameEn}</span><span>{fastMap.get(product.id)} shipped</span></li>)}{fastMoving.length === 0 && <li className="text-smoke">No shipped movement data yet.</li>}</ul></section>
        <section className="rounded-lg border border-white/10 p-4"><h2 className="flex items-center gap-2 text-sm text-parchment"><ArrowDownRight size={15} className="text-gold" />Slow moving</h2><ul className="mt-3 space-y-2 text-xs">{slowMoving.map((product) => <li key={product.id} className="flex justify-between gap-3 text-smoke"><span className="text-parchment">{product.nameEn}</span><span>{product.availableStock} available · no 30d sale</span></li>)}{slowMoving.length === 0 && <li className="text-smoke">No slow-moving signal yet.</li>}</ul></section>
        <section className="rounded-lg border border-white/10 p-4"><h2 className="flex items-center gap-2 text-sm text-parchment"><AlertTriangle size={15} className="text-red-200" />Restock candidates</h2><ul className="mt-3 space-y-2 text-xs">{restock.map(({ product, score }) => <li key={product.id} className="flex justify-between gap-3 text-smoke"><span className="text-parchment">{product.nameEn}</span><span>priority {Math.round(score)}</span></li>)}{restock.length === 0 && <li className="text-smoke">Stock levels are currently healthy.</li>}</ul><p className="mt-3 text-[10px] text-smoke">Cancelled orders released {Math.abs(cancelledImpact._sum.quantityChanged ?? 0)} reserved units in 30 days.</p></section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 p-4"><h2 className="text-sm text-parchment">Stock selling value by brand</h2><div className="mt-3 space-y-2">{brandValues.map(([name, value]) => <div key={name} className="flex items-center justify-between text-xs text-smoke"><span>{name}</span><span className="text-parchment">${value.toFixed(0)}</span></div>)}</div></section>
        <section className="rounded-lg border border-white/10 p-4"><h2 className="text-sm text-parchment">Stock selling value by category</h2><div className="mt-3 space-y-2">{categoryValues.map(([name, value]) => <div key={name} className="flex items-center justify-between text-xs text-smoke"><span>{name}</span><span className="text-parchment">${value.toFixed(0)}</span></div>)}</div></section>
      </div>

      <form className="grid gap-2 rounded-lg border border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-10">
        <input name="q" defaultValue={searchParams.q} placeholder="Name, brand, SKU, barcode, note…" className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment placeholder:text-smoke focus:border-gold/40 focus:outline-none xl:col-span-2" />
        <select name="status" defaultValue={searchParams.status ?? ''} className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"><option value="">All statuses</option>{validStatuses.map((status) => <option key={status}>{status}</option>)}</select>
        <select name="brand" defaultValue={searchParams.brand ?? ''} className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>
        <select name="category" defaultValue={searchParams.category ?? ''} className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn}</option>)}</select>
        <input name="minPrice" type="number" min="0" defaultValue={searchParams.minPrice} placeholder="Min price" className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment" /><input name="maxPrice" type="number" min="0" defaultValue={searchParams.maxPrice} placeholder="Max price" className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment" />
        <input name="minStock" type="number" min="0" defaultValue={searchParams.minStock} placeholder="Min available" className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment" /><input name="maxStock" type="number" min="0" defaultValue={searchParams.maxStock} placeholder="Max available" className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment" />
        <div className="flex gap-2"><button className="flex-1 rounded-md bg-gold px-3 py-2 text-xs font-medium text-ink">Filter</button><Link href="/studio/inventory" className="rounded-md border border-white/10 px-3 py-2 text-xs text-smoke">Clear</Link></div>
      </form>

      <div className="flex items-center justify-between text-xs text-smoke"><span>{total} matching products</span><span>Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span></div>
      <InventoryManager products={productData} />
      {total > PAGE_SIZE && <nav className="flex justify-center gap-2">{page > 1 && <Link href={`?${baseQuery.toString()}&page=${page - 1}`} className="rounded-md border border-white/10 px-4 py-2 text-xs text-smoke">Previous</Link>}{page * PAGE_SIZE < total && <Link href={`?${baseQuery.toString()}&page=${page + 1}`} className="rounded-md border border-white/10 px-4 py-2 text-xs text-smoke">Next</Link>}</nav>}
    </div>
  );
}
