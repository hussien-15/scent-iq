import { PageHeadingSkeleton, ProductGridSkeleton } from '@/components/loading/StorefrontSkeleton';

export default function ShopLoading() {
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><PageHeadingSkeleton /><div className="mb-8 h-14 animate-pulse rounded-full bg-white/[0.04]" /><div className="mb-10 h-24 animate-pulse rounded-sm bg-white/[0.03]" /><ProductGridSkeleton count={8} /></div>;
}
