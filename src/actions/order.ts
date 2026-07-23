'use server';

import { Prisma } from '@prisma/client';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { enforceRateLimit, orderConfirmationToken, requestSecurityKey } from '@/lib/security';
import { findOrderBySubmissionId } from '@/repositories/order.repository';
import { createCheckoutOrder, type CheckoutResult } from '@/services/checkout.service';
import { checkoutSchema } from '@/validators/checkout';
import { getMaintenanceState, isOrderingAvailable } from '@/services/maintenance.service';

export type CreateOrderResult = CheckoutResult | { success: false; error: 'validation' | 'ordering_disabled' };

/**
 * Public checkout boundary. It accepts identifiers and quantities only; the
 * checkout service re-reads price, delivery and inventory on the server.
 */
export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  try {
    await enforceRateLimit('checkout.create', requestSecurityKey(await headers()), 5, 10 * 60 * 1000);
  } catch {
    return { success: false, error: 'server_error' };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'validation' };

  if (!isOrderingAvailable(await getMaintenanceState())) {
    return { success: false, error: 'ordering_disabled' };
  }

  try {
    const session = await auth();
    return await createCheckoutOrder(parsed.data, session?.user?.id);
  } catch (error) {
    // A concurrent retry with the same submission id is a successful replay,
    // not a second order and not a customer-facing server error.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await findOrderBySubmissionId(parsed.data.submissionId);
      if (existing) {
        return { success: true, orderId: existing.id, confirmationToken: orderConfirmationToken(existing.id) };
      }
    }
    console.error('[checkout.create]', error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: 'server_error' };
  }
}
