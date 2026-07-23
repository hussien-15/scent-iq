'use server';

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/authorization';

const adminRoles = ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR', 'ORDER_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SUPPORT', 'SEO_EDITOR', 'VIEWER'] as const;
const statuses = ['ACTIVE', 'DISABLED', 'SUSPENDED', 'PENDING'] as const;
const password = z.string().min(12).max(128)
  .regex(/[a-z]/, 'Use a lowercase letter.')
  .regex(/[A-Z]/, 'Use an uppercase letter.')
  .regex(/[0-9]/, 'Use a number.')
  .regex(/[^A-Za-z0-9]/, 'Use a special character.');

const createSchema = z.object({
  name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email().max(254),
  password, adminRole: z.enum(adminRoles), adminStatus: z.enum(statuses),
});
const updateSchema = z.object({
  name: z.string().trim().min(2).max(100), adminRole: z.enum(adminRoles), adminStatus: z.enum(statuses),
});

export type AdminActionState = { success?: boolean; error?: string };
function value(formData: FormData, key: string) { return String(formData.get(key) ?? ''); }

export async function createAdmin(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireSuperAdmin();
  const parsed = createSchema.safeParse({ name: value(formData, 'name'), email: value(formData, 'email'), password: value(formData, 'password'), adminRole: value(formData, 'adminRole'), adminStatus: value(formData, 'adminStatus') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Review the admin details.' };
  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { name: parsed.data.name, email: parsed.data.email, passwordHash, role: 'ADMIN', adminRole: parsed.data.adminRole, adminStatus: parsed.data.adminStatus, passwordChangedAt: new Date() } });
      const role = await tx.adminRole.upsert({ where: { key: parsed.data.adminRole }, update: {}, create: { key: parsed.data.adminRole, name: parsed.data.adminRole.replaceAll('_', ' ') } });
      await tx.adminUserRole.create({ data: { adminUserId: created.id, adminRoleId: role.id } });
      await tx.activityLog.create({ data: { adminId: actor.id, actorName: actor.name ?? actor.email, action: 'admin.created', affectedType: 'AdminUser', affectedId: created.id, affectedName: created.name ?? 'Admin account', newValue: { role: created.adminRole, status: created.adminStatus } } });
      await tx.auditLog.create({ data: { adminId: actor.id, action: 'ADMIN_CREATED', entityType: 'AdminUser', entityId: created.id, newValue: { role: created.adminRole, status: created.adminStatus } } });
    });
    revalidatePath('/studio/admins'); revalidatePath('/studio/activity');
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { error: 'This email is already in use.' };
    return { error: 'The admin account could not be created.' };
  }
}

export async function updateAdmin(adminId: string, _state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireSuperAdmin();
  const parsed = updateSchema.safeParse({ name: value(formData, 'name'), adminRole: value(formData, 'adminRole'), adminStatus: value(formData, 'adminStatus') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Review the admin details.' };
  const current = await prisma.user.findFirst({ where: { id: adminId, role: 'ADMIN' } });
  if (!current) return { error: 'Admin account not found.' };
  if (current.id === actor.id && (parsed.data.adminStatus !== 'ACTIVE' || parsed.data.adminRole !== 'SUPER_ADMIN')) return { error: 'You cannot disable or demote your current Super Admin session.' };
  if (current.adminRole === 'SUPER_ADMIN' && current.adminStatus === 'ACTIVE' && (parsed.data.adminRole !== 'SUPER_ADMIN' || parsed.data.adminStatus !== 'ACTIVE')) {
    const remaining = await prisma.user.count({ where: { role: 'ADMIN', adminRole: 'SUPER_ADMIN', adminStatus: 'ACTIVE', id: { not: current.id } } });
    if (remaining === 0) return { error: 'At least one active Super Admin must remain.' };
  }
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: current.id }, data: { name: parsed.data.name, adminRole: parsed.data.adminRole, adminStatus: parsed.data.adminStatus, sessionVersion: { increment: 1 } } });
    const role = await tx.adminRole.upsert({ where: { key: parsed.data.adminRole }, update: {}, create: { key: parsed.data.adminRole, name: parsed.data.adminRole.replaceAll('_', ' ') } });
    await tx.adminUserRole.deleteMany({ where: { adminUserId: current.id } });
    await tx.adminUserRole.create({ data: { adminUserId: current.id, adminRoleId: role.id } });
    await tx.activityLog.create({ data: { adminId: actor.id, actorName: actor.name ?? actor.email, action: 'admin.access.updated', affectedType: 'AdminUser', affectedId: current.id, affectedName: parsed.data.name, previousValue: { role: current.adminRole, status: current.adminStatus }, newValue: { role: parsed.data.adminRole, status: parsed.data.adminStatus } } });
    await tx.auditLog.create({ data: { adminId: actor.id, action: 'ADMIN_ACCESS_UPDATED', entityType: 'AdminUser', entityId: current.id, previousValue: { role: current.adminRole, status: current.adminStatus }, newValue: { role: parsed.data.adminRole, status: parsed.data.adminStatus } } });
  });
  revalidatePath('/studio/admins'); revalidatePath('/studio/activity');
  return { success: true };
}
