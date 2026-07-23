import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { uploadImageAssetToCloudinary } from '@/lib/cloudinary';
import { ValidationError } from '@/lib/errors';
import { hasValidImageSignature, isAllowedImage } from '@/lib/security';
import { createImageMedia, findMediaByHash } from '@/repositories/media.repository';

export async function uploadMediaImage(input: {
  file: File;
  altText?: string;
  admin: { id: string; name: string | null; email: string };
}) {
  const { file, admin } = input;
  if (!isAllowedImage(file) || file.size <= 0 || file.size > 8 * 1024 * 1024 || !(await hasValidImageSignature(file))) {
    throw new ValidationError('Use a valid JPG, PNG, WebP, or AVIF image smaller than 8 MB.');
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const contentHash = createHash('sha256').update(bytes).digest('hex');
  const duplicate = await findMediaByHash(contentHash);
  if (duplicate) return { ...duplicate, duplicate: true };

  const asset = await uploadImageAssetToCloudinary(file, 'scentiq/media');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120) || 'image';
  const media = await createImageMedia({
    name: safeName,
    url: asset.url,
    altText: input.altText?.trim().slice(0, 240) || null,
    sizeBytes: asset.bytes ?? file.size,
    width: asset.width,
    height: asset.height,
    mimeType: file.type,
    contentHash,
  });
  await prisma.activityLog.create({
    data: {
      adminId: admin.id,
      actorName: admin.name ?? admin.email,
      action: 'media.uploaded',
      affectedType: 'Media',
      affectedId: media.id,
      affectedName: safeName,
      metadata: { mimeType: file.type, sizeBytes: file.size },
    },
  });
  return { id: media.id, url: media.url, width: media.width, height: media.height, duplicate: false };
}
