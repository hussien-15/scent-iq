import { prisma } from '@/lib/prisma';

export function findMediaByHash(contentHash: string) {
  return prisma.media.findUnique({ where: { contentHash }, select: { id: true, url: true, width: true, height: true } });
}

export function createImageMedia(data: {
  name: string;
  url: string;
  altText?: string | null;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  mimeType: string;
  contentHash: string;
}) {
  return prisma.media.create({ data: { ...data, type: 'IMAGE' } });
}
