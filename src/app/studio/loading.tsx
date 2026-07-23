export default function StudioLoading() {
  return <div className="space-y-6" aria-label="Loading Perfume Studio"><div className="h-9 w-64 animate-pulse rounded bg-white/[0.06]" /><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />)}</div><div className="h-80 animate-pulse rounded-xl border border-white/10 bg-white/[0.02]" /></div>;
}
