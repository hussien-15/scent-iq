import { PageHeadingSkeleton, ProductGridSkeleton } from '@/components/loading/StorefrontSkeleton';

export default function StorefrontLoading() {
  return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"><PageHeadingSkeleton /><ProductGridSkeleton /></div>;
}
