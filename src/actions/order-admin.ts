'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/authorization';
import { changeOrderStatus, ORDER_STATUSES, saveOrderInternalNote, type OrderStatusValue } from '@/services/order.service';
import { revalidateOrder } from '@/services/revalidation.service';

const statusInputSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(1000).optional(),
  returnToStock: z.boolean(),
});

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatusValue,
  note?: string,
  returnToStock = false
) {
  const input = statusInputSchema.parse({ orderId, newStatus, note, returnToStock });
  const admin = await requirePermission(input.newStatus === 'CANCELLED' ? 'orders.cancel' : 'orders.update_status');
  const result = await changeOrderStatus({ ...input, admin });
  if (result.changed) revalidateOrder(input.orderId, result.productSlugs);
}

export async function addOrderInternalNote(orderId: string, note: string) {
  const input = z.object({
    orderId: z.string().uuid(),
    note: z.string().trim().min(1).max(2000),
  }).parse({ orderId, note });
  const admin = await requirePermission('orders.update_status');
  await saveOrderInternalNote({ ...input, admin });
  revalidatePath(`/studio/orders/${input.orderId}`);
}
