import { createHmac, timingSafeEqual } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super('Too many requests. Please try again later.');
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function securityHash(value: string) {
  return createHmac('sha256', process.env.AUTH_SECRET || 'scentiq-development-only')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

export function orderConfirmationToken(orderId: string) {
  return createHmac('sha256', process.env.AUTH_SECRET || 'scentiq-development-only').update(`order-confirmation:${orderId}`).digest('hex');
}

export function verifyOrderConfirmationToken(orderId: string, token: string) {
  const expected = Buffer.from(orderConfirmationToken(orderId));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function clientIp(headers: Headers) {
  return (headers.get('cf-connecting-ip') || headers.get('x-real-ip') || headers.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim();
}

export function requestSecurityKey(headers: Headers, extra = '') {
  return securityHash(`${clientIp(headers)}|${headers.get('user-agent') ?? 'unknown'}|${extra}`);
}

export async function enforceRateLimit(action: string, keyHash: string, limit: number, windowMs: number) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  const check = () => prisma.$transaction(async (tx) => {
    const bucket = await tx.rateLimitBucket.findUnique({ where: { action_keyHash: { action, keyHash } } });
    if (!bucket || bucket.expiresAt <= now) {
      await tx.rateLimitBucket.upsert({
        where: { action_keyHash: { action, keyHash } },
        update: { count: 1, windowStart: now, expiresAt },
        create: { action, keyHash, count: 1, windowStart: now, expiresAt },
      });
      return;
    }
    if (bucket.count >= limit) throw new RateLimitError(Math.max(1, Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000)));
    await tx.rateLimitBucket.update({ where: { id: bucket.id }, data: { count: { increment: 1 } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { await check(); return; } catch (error) {
      if (error instanceof RateLimitError) throw error;
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt === 0)) throw error;
    }
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') throw new Error('Cross-site request rejected.');
  if (!origin) {
    if (process.env.NODE_ENV === 'production') throw new Error('Missing request origin.');
    return;
  }
  const originHost = new URL(origin).host;
  if (!host || originHost !== host) throw new Error('Invalid request origin.');
}

export function isAllowedImage(file: File) {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);
  return allowedTypes.has(file.type) && Boolean(extension && allowedExtensions.has(extension));
}

export async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === 'image/png') return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (file.type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (file.type === 'image/avif') return String.fromCharCode(...bytes.slice(4, 12)).startsWith('ftyp') && ['avif', 'avis'].includes(String.fromCharCode(...bytes.slice(8, 12)));
  return false;
}
