import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Prisma } from '@prisma/client';
import { AppError, ConflictError, ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export const WEBHOOK_PROVIDERS = ['delivery', 'payment', 'notifications'] as const;
export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[number];

function webhookSecret(provider: WebhookProvider) {
  const providerKey = `WEBHOOK_SECRET_${provider.toUpperCase()}`;
  return process.env[providerKey] || process.env.WEBHOOK_SECRET;
}

export function verifyWebhookSignature(provider: WebhookProvider, payload: string, receivedSignature: string) {
  const secret = webhookSecret(provider);
  if (!secret) throw new AppError('INTERNAL_ERROR', 'Webhook receiver is not configured.', 503);
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const received = receivedSignature.replace(/^sha256=/i, '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}

export async function receiveWebhook(input: {
  provider: WebhookProvider;
  eventId: string;
  signature: string;
  rawBody: string;
}) {
  if (Buffer.byteLength(input.rawBody, 'utf8') > 1024 * 1024) throw new ValidationError('Webhook payload is too large.');
  if (!/^[a-zA-Z0-9._:-]{8,160}$/.test(input.eventId)) throw new ValidationError('Invalid webhook event identifier.');
  if (!verifyWebhookSignature(input.provider, input.rawBody, input.signature)) {
    throw new AppError('PERMISSION_DENIED', 'Webhook signature is invalid.', 401);
  }

  const payloadHash = createHash('sha256').update(input.rawBody).digest('hex');
  try {
    const receipt = await prisma.webhookReceipt.create({
      data: {
        provider: input.provider,
        eventId: input.eventId,
        payloadHash,
        signatureVerified: true,
        status: 'RECEIVED',
      },
    });

    // Integration-specific work is intentionally added here later. The first
    // version authenticates, deduplicates and records the event without
    // trusting it to mutate orders or payments.
    await prisma.webhookReceipt.update({
      where: { id: receipt.id },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
    return { accepted: true, duplicate: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.webhookReceipt.findUnique({
        where: { provider_eventId: { provider: input.provider, eventId: input.eventId } },
        select: { payloadHash: true, signatureVerified: true, status: true },
      });
      if (existing?.payloadHash !== payloadHash) throw new ConflictError('Webhook event id was already used with a different payload.');
      return { accepted: true, duplicate: true };
    }
    throw error;
  }
}
