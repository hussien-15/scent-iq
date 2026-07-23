import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import MediaLibraryManager from '@/components/studio/MediaLibraryManager';

export const dynamic = 'force-dynamic';

export default async function StudioMediaPage() {
  await requirePermission('media.view');
  const media = await prisma.media.findMany({
    where: { type: { in: ['IMAGE', 'LOGO', 'BANNER'] } },
    orderBy: { createdAt: 'desc' },
    take: 120,
    select: {
      id: true,
      url: true,
      name: true,
      altText: true,
      type: true,
      width: true,
      height: true,
      sizeBytes: true,
      createdAt: true,
    },
  });
  return (
    <MediaLibraryManager initialMedia={media.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} />
  );
}
