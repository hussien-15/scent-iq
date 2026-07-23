import type { Prisma } from '@prisma/client';

export type StoreLaunchStatus = 'SETUP' | 'PREVIEW' | 'LIVE';

export function parseStoreLaunch(value: Prisma.JsonValue | null | undefined) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const status = String((value as Record<string, unknown>).status ?? '').toUpperCase();
    if (status === 'PREVIEW' || status === 'LIVE') return status as StoreLaunchStatus;
  }
  return 'SETUP' as StoreLaunchStatus;
}

export function readObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
