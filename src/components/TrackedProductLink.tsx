'use client';

import Link from 'next/link';
import { trackAnalyticsEvent } from '@/lib/analytics-client';

export default function TrackedProductLink({
  href,
  perfumeId,
  recommendationType,
  className,
  children,
}: {
  href: string;
  perfumeId: string;
  recommendationType: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onClick={() => trackAnalyticsEvent({
        event: 'RECOMMENDATION_CLICK',
        perfumeId,
        metadata: { recommendationType },
      })}
    >
      {children}
    </Link>
  );
}
