import Link from 'next/link';

export default function Pagination({
  path,
  searchParams,
  page,
  totalPages,
  previousLabel,
  nextLabel,
}: {
  path: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
  previousLabel: string;
  nextLabel: string;
}) {
  if (totalPages <= 1) return null;

  function href(nextPage: number) {
    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') query.set(key, value);
    });
    if (nextPage > 1) query.set('page', String(nextPage));
    const serialized = query.toString();
    return `${path}${serialized ? `?${serialized}` : ''}`;
  }

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={href(Math.max(1, page - 1))}
        prefetch={false}
        aria-disabled={page === 1}
        className={`flex min-h-11 items-center rounded-full border px-4 text-xs ${page === 1 ? 'pointer-events-none border-ink-line text-smoke/50' : 'border-ink-line text-parchment hover:border-gold/40'}`}
      >
        {previousLabel}
      </Link>
      {pages.map((item) => (
        <Link
          key={item}
          href={href(item)}
          prefetch={false}
          aria-current={item === page ? 'page' : undefined}
          className={`flex h-11 min-w-11 items-center justify-center rounded-full border text-xs ${item === page ? 'border-gold bg-gold/10 text-gold-bright' : 'border-ink-line text-smoke hover:border-gold/40 hover:text-parchment'}`}
        >
          {item}
        </Link>
      ))}
      <Link
        href={href(Math.min(totalPages, page + 1))}
        prefetch={false}
        aria-disabled={page === totalPages}
        className={`flex min-h-11 items-center rounded-full border px-4 text-xs ${page === totalPages ? 'pointer-events-none border-ink-line text-smoke/50' : 'border-ink-line text-parchment hover:border-gold/40'}`}
      >
        {nextLabel}
      </Link>
    </nav>
  );
}
