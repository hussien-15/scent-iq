'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';

const companySchema = z.object({
  id: z.string().max(100).optional(),
  name: z.string().trim().min(2).max(120),
  contactNumber: z.string().trim().max(40).optional(),
  estimatedDays: z.string().trim().min(2).max(80),
  status: z.enum(['ACTIVE', 'DISABLED', 'ARCHIVED']),
  notes: z.string().trim().max(1000).optional(),
  baseFee: z.number().nonnegative().optional(),
});

export type DeliveryActionState = { success?: boolean; error?: string };

function parseFees(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 50) throw new Error('Use at most 50 city/area fee rows.');
  return lines.map((line, index) => {
    const [place, feeText] = line.split(/[=,]/).map((part) => part.trim());
    const [city, area] = (place ?? '').split('/').map((part) => part.trim());
    const fee = Number(feeText);
    if (!city || !Number.isFinite(fee) || fee < 0) throw new Error(`Invalid fee line ${index + 1}. Use City=5000 or City/Area=6000.`);
    return { city, area: area || null, fee };
  });
}

export async function saveDeliveryCompany(_state: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const admin = await requirePermission('delivery.edit');
  try {
    const parsed = companySchema.parse({
      id: String(formData.get('id') ?? '') || undefined,
      name: String(formData.get('name') ?? ''),
      contactNumber: String(formData.get('contactNumber') ?? '') || undefined,
      estimatedDays: String(formData.get('estimatedDays') ?? ''),
      status: String(formData.get('status') ?? ''),
      notes: String(formData.get('notes') ?? '') || undefined,
      baseFee: formData.get('baseFee') ? Number(formData.get('baseFee')) : undefined,
    });
    const fees = parseFees(String(formData.get('fees') ?? ''));
    if (parsed.status === 'ACTIVE' && !fees.length) return { error: 'An active delivery company needs at least one verified city fee.' };
    const current = parsed.id ? await prisma.deliveryCompany.findUnique({ where: { id: parsed.id }, include: { fees: true } }) : null;
    if (parsed.id && !current) return { error: 'Delivery company not found.' };
    await prisma.$transaction(async (tx) => {
      const company = current
        ? await tx.deliveryCompany.update({ where: { id: current.id }, data: {
            name: parsed.name, contactNumber: parsed.contactNumber || null, estimatedDays: parsed.estimatedDays,
            status: parsed.status, notes: parsed.notes || null, baseFee: parsed.baseFee,
            supportedCities: [...new Set(fees.map((fee) => fee.city))],
          } })
        : await tx.deliveryCompany.create({ data: {
            name: parsed.name, contactNumber: parsed.contactNumber || null, estimatedDays: parsed.estimatedDays,
            status: parsed.status, notes: parsed.notes || null, baseFee: parsed.baseFee,
            supportedCities: [...new Set(fees.map((fee) => fee.city))],
          } });
      await tx.deliveryFee.deleteMany({ where: { deliveryCompanyId: company.id } });
      if (fees.length) await tx.deliveryFee.createMany({ data: fees.map((fee) => ({ deliveryCompanyId: company.id, ...fee })) });
      await tx.activityLog.create({ data: {
        adminId: admin.id, actorName: admin.name ?? admin.email, action: current ? 'delivery.updated' : 'delivery.created',
        affectedType: 'DeliveryCompany', affectedId: company.id, affectedName: company.name,
        previousValue: current ? { name: current.name, status: current.status, feeCount: current.fees.length } : Prisma.JsonNull,
        newValue: { name: company.name, status: company.status, feeCount: fees.length },
      } });
      await tx.auditLog.create({ data: {
        adminId: admin.id, action: current ? 'DELIVERY_COMPANY_UPDATED' : 'DELIVERY_COMPANY_CREATED',
        entityType: 'DeliveryCompany', entityId: company.id,
        previousValue: current ? { name: current.name, status: current.status, feeCount: current.fees.length } : Prisma.JsonNull,
        newValue: { name: company.name, status: company.status, feeCount: fees.length },
      } });
    });
    for (const path of ['/studio/delivery', '/studio/setup', '/ar/checkout', '/en/checkout']) revalidatePath(path);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0]?.message ?? 'Review the delivery fields.' };
    return { error: error instanceof Error ? error.message : 'Delivery settings could not be saved.' };
  }
}
