'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

const maintenanceSchema = z.object({
  mode: z.enum(['OFF', 'ORDERING', 'STOREFRONT']),
  messageAr: z.string().trim().min(10).max(400),
  messageEn: z.string().trim().min(10).max(400),
});

export type MaintenanceActionState = { success?: boolean; error?: string };

export async function saveMaintenanceMode(
  _state: MaintenanceActionState,
  formData: FormData
): Promise<MaintenanceActionState> {
  const admin = await requirePermission('settings.edit');
  const parsed = maintenanceSchema.safeParse({
    mode: String(formData.get('mode') ?? ''),
    messageAr: String(formData.get('messageAr') ?? ''),
    messageEn: String(formData.get('messageEn') ?? ''),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Review the maintenance settings.' };

  const previous = await prisma.siteSetting.findUnique({ where: { key: 'store.maintenance' } });
  const value = { ...parsed.data, updatedAt: new Date().toISOString() };
  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: 'store.maintenance' },
      update: { value, group: 'operations' },
      create: { key: 'store.maintenance', value, group: 'operations' },
    }),
    prisma.activityLog.create({
      data: {
        adminId: admin.id,
        actorName: admin.name ?? admin.email,
        action: 'store.maintenance.updated',
        affectedType: 'SiteSetting',
        affectedId: 'store.maintenance',
        affectedName: 'Store maintenance mode',
        previousValue: previous?.value ?? Prisma.JsonNull,
        newValue: value,
      },
    }),
    prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'STORE_MAINTENANCE_UPDATED',
        entityType: 'SiteSetting',
        entityId: 'store.maintenance',
        previousValue: previous?.value ?? Prisma.JsonNull,
        newValue: value,
      },
    }),
  ]);

  revalidateTag('store-maintenance');
  for (const path of [
    '/ar',
    '/en',
    '/ar/checkout',
    '/en/checkout',
    '/studio/settings',
    '/studio/system-health',
    '/robots.txt',
    '/sitemap.xml',
  ]) {
    revalidatePath(path);
  }
  return { success: true };
}
