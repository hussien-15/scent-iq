import Link from 'next/link';

export default function StudioPagination({
  path,
  searchParams,
  page,
  totalPages,
  total,
}: {
  path: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return <p className="text-[11px] text-smoke">{total} total</p>;
  function href(nextPage: number) {
    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => { if (value && key !== 'page') query.set(key, value); });
    if (nextPage > 1) query.set('page', String(nextPage));
    return `${path}?${query.toString()}`;
  }
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 text-xs text-smoke" aria-label="Table pagination">
      <span>{total} total · Page {page} of {totalPages}</span>
      <div className="flex gap-2"><Link href={href(Math.max(1, page - 1))} aria-disabled={page === 1} className={`flex min-h-10 items-center rounded-md border border-white/10 px-4 ${page === 1 ? 'pointer-events-none opacity-40' : 'hover:border-studioBlue/40 hover:text-parchment'}`}>Previous</Link><Link href={href(Math.min(totalPages, page + 1))} aria-disabled={page === totalPages} className={`flex min-h-10 items-center rounded-md border border-white/10 px-4 ${page === totalPages ? 'pointer-events-none opacity-40' : 'hover:border-studioBlue/40 hover:text-parchment'}`}>Next</Link></div>
    </nav>
  );
}
