import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { requirePermission } from '@/lib/authorization';
import { ValidationError } from '@/lib/errors';
import { assertSameOrigin, enforceRateLimit, requestSecurityKey } from '@/lib/security';
import { uploadMediaImage } from '@/services/media.service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('media.upload');
    assertSameOrigin(request);
    await enforceRateLimit('admin.media.upload', requestSecurityKey(request.headers, admin.id), 20, 15 * 60 * 1000);
    const incoming = await request.formData();
    const file = incoming.get('file');
    if (!(file instanceof File)) throw new ValidationError('Choose an image to upload.');
    const data = await uploadMediaImage({ file, altText: String(incoming.get('altText') ?? ''), admin });
    return apiSuccess(data, { status: data.duplicate ? 200 : 201 });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
