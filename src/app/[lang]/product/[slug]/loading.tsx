export default function ProductLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16" aria-label="Loading product">
      <div className="aspect-[4/5] animate-pulse rounded-sm bg-white/[0.04]" />
      <div className="space-y-5 pt-2"><div className="h-2 w-24 animate-pulse rounded bg-white/[0.05]" /><div className="h-12 w-4/5 animate-pulse rounded bg-white/[0.07]" /><div className="h-20 animate-pulse rounded bg-white/[0.04]" /><div className="h-8 w-32 animate-pulse rounded bg-white/[0.06]" /><div className="h-12 animate-pulse rounded-full bg-white/[0.05]" /><div className="h-40 animate-pulse rounded bg-white/[0.03]" /></div>
    </div>
  );
}
