import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import StatusSelect from '@/components/studio/StatusSelect';
import { getCompletionScore } from '@/services/product-completion.service';
import type { ProductCompletionInput } from '@/services/product-completion.service';
import StudioPagination from '@/components/studio/StudioPagination';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { PackageOpen, SearchX } from 'lucide-react';
import { formatPrice } from '@/utils/format-price';

export const dynamic = 'force-dynamic';

export default async function StudioProductsPage(props: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const searchParams = await props.searchParams;
  const { q } = searchParams;
  const pageSize = 25;
  const requestedPage = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1);
  const where = q
    ? {
        OR: [
          { nameEn: { contains: q, mode: 'insensitive' as const } },
          { sku: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const total = await prisma.perfume.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const perfumes = await prisma.perfume.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      brand: { select: { name: true } },
      media: { select: { id: true } },
      notes: { select: { id: true } },
      tags: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-parchment">Products</h1>
        <div className="flex gap-2">
          <Link
            href="/studio/products/import"
            className="rounded-md border border-gold/30 px-4 py-2 text-xs text-gold-bright hover:border-gold"
          >
            Import products
          </Link>
          <Link
            href="/studio/products/new"
            className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink hover:bg-gold-bright transition-colors"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or SKU..."
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-parchment placeholder:text-smoke focus:border-studioBlue/50 focus:outline-none"
        />
      </form>

      {perfumes.length === 0 ? (
        <EmptyState
          icon={q ? SearchX : PackageOpen}
          title={q ? 'No matching products' : 'No products yet'}
          description={
            q
              ? 'Try a product name or SKU, or clear the current search.'
              : 'Add the first perfume manually or import a prepared catalog file.'
          }
          action={
            q
              ? { label: 'Clear search', href: '/studio/products' }
              : { label: 'Add product', href: '/studio/products/new' }
          }
          secondaryAction={!q ? { label: 'Import products', href: '/studio/products/import' } : undefined}
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {perfumes.map((p: ProductCompletionInput & Record<string, unknown> & { id: string }) => {
              const completion = getCompletionScore(p);
              const lowStock = ['LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED'].includes(p.inventoryStatus as string);
              return (
                <article key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/studio/products/${p.id}`} className="font-medium text-parchment hover:text-gold-bright">{p.nameEn as string}</Link>
                      <p className="mt-1 text-[10px] text-smoke">
                        {(p.brand as { name: string }).name} · {p.sku as string}
                      </p>
                    </div>
                    <StatusBadge status={p.status as string} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="block text-[9px] uppercase text-smoke">Price</span>
                      <span className="text-parchment">
                        {formatPrice(Number((p.price as { toString: () => string }).toString()))}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase text-smoke">Available</span>
                      <span className={lowStock ? 'text-amber-200' : 'text-parchment'}>
                        {p.availableStock as number}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase text-smoke">Complete</span>
                      <span className="text-parchment">{completion.percent}%</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <StatusSelect perfumeId={p.id} currentStatus={p.status as string} />
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto rounded-lg border border-white/10 md:block">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-white/10 text-smoke">
                <tr>
                  <th className="p-3 font-normal">Product</th>
                  <th className="p-3 font-normal">Brand</th>
                  <th className="p-3 font-normal">SKU</th>
                  <th className="p-3 font-normal">Price</th>
                  <th className="p-3 font-normal">Stock</th>
                  <th className="p-3 font-normal">Available</th>
                  <th className="p-3 font-normal">Completion</th>
                  <th className="p-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {perfumes.map((p: ProductCompletionInput & Record<string, unknown> & { id: string }) => {
                  const completion = getCompletionScore(p);
                  const lowStock = ['LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED'].includes(p.inventoryStatus as string);
                  return (
                    <tr key={p.id} className="border-b border-white/5 last:border-0">
                      <td className="p-3"><Link href={`/studio/products/${p.id}`} className="text-parchment hover:text-gold-bright">{p.nameEn as string}</Link></td>
                      <td className="p-3 text-smoke">{(p.brand as { name: string }).name}</td>
                      <td className="p-3 text-smoke">{p.sku as string}</td>
                      <td className="p-3 text-smoke">
                        {formatPrice(Number((p.price as { toString: () => string }).toString()))}
                      </td>
                      <td className={`p-3 ${lowStock ? 'text-gold-bright' : 'text-smoke'}`}>
                        {p.stock as number}{' '}
                        <span className="text-[10px] text-smoke">({p.reservedStock as number} reserved)</span>
                      </td>
                      <td className={`p-3 ${lowStock ? 'text-gold-bright' : 'text-smoke'}`}>
                        <span className="block">{p.availableStock as number}</span>
                        <span className="text-[9px]">{String(p.inventoryStatus).replaceAll('_', ' ')}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full ${completion.percent === 100 ? 'bg-studioBlue' : 'bg-gold'}`}
                              style={{ width: `${completion.percent}%` }}
                            />
                          </div>
                          <span className="text-smoke">{completion.percent}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusSelect perfumeId={p.id} currentStatus={p.status as string} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <StudioPagination
        path="/studio/products"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}
