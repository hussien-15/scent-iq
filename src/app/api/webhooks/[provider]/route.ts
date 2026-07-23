import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { receiveWebhook, WEBHOOK_PROVIDERS } from '@/services/webhook.service';

export const runtime = 'nodejs';

const providerSchema = z.enum(WEBHOOK_PROVIDERS);

export async function POST(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  try {
    const provider = providerSchema.parse((await context.params).provider);
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 1024 * 1024) throw new ValidationError('Webhook payload is too large.');
    const eventId = request.headers.get('x-scentiq-event-id') ?? '';
    const signature = request.headers.get('x-scentiq-signature') ?? '';
    const data = await receiveWebhook({ provider, eventId, signature, rawBody: await request.text() });
    return apiSuccess(data, { status: 202, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
