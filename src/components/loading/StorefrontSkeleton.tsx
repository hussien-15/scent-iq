function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-ink-line" aria-hidden="true">
      <div className="aspect-[4/5] animate-pulse bg-white/[0.04]" />
      <div className="space-y-3 p-4"><div className="h-2 w-1/3 animate-pulse rounded bg-white/[0.06]" /><div className="h-5 w-3/4 animate-pulse rounded bg-white/[0.06]" /><div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.05]" /></div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: count }, (_, index) => <CardSkeleton key={index} />)}</div>;
}

export function PageHeadingSkeleton() {
  return <div className="mb-10 space-y-3" aria-hidden="true"><div className="h-2 w-24 animate-pulse rounded bg-white/[0.06]" /><div className="h-10 w-64 max-w-full animate-pulse rounded bg-white/[0.07]" /></div>;
}
