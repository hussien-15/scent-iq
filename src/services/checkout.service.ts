import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { orderConfirmationToken } from '@/lib/security';
import { findOrderBySubmissionId } from '@/repositories/order.repository';
import { findPublishedCheckoutProducts } from '@/repositories/product.repository';
import { publicCollectionWhere } from '@/services/collection.service';
import { getDeliveryFee, getFreeDeliveryThreshold } from '@/services/delivery.service';
import { applyInventoryMovement, availableStock } from '@/services/inventory.service';
import type { CheckoutInput } from '@/validators/checkout';

export type CheckoutResult =
  | { success: true; orderId: string; confirmationToken: string }
  | { success: false; error: 'invalid_items' | 'no_delivery' | 'server_error' }
  | { success: false; error: 'out_of_stock'; perfumeName: string };

export function createOrderNumber(date = new Date(), suffix = randomBytes(4).toString('hex').toUpperCase()) {
  const day = date.toISOString().slice(0, 10).replaceAll('-', '');
  return `SIQ-${day}-${suffix}`;
}

export function calculateCheckoutTotals(
  items: Array<{ price: number; quantity: number }>,
  deliveryFee: number,
  freeDeliveryThreshold: number | null
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalDeliveryFee = freeDeliveryThreshold != null && subtotal >= freeDeliveryThreshold ? 0 : deliveryFee;
  return { subtotal, deliveryFee: finalDeliveryFee, total: subtotal + finalDeliveryFee };
}

export async function createCheckoutOrder(data: CheckoutInput, userId?: string): Promise<CheckoutResult> {
  const priorSubmission = await findOrderBySubmissionId(data.submissionId);
  if (priorSubmission) {
    return { success: true, orderId: priorSubmission.id, confirmationToken: orderConfirmationToken(priorSubmission.id) };
  }

  const perfumeIds = data.items.map((item) => item.perfumeId);
  const perfumes = await findPublishedCheckoutProducts(perfumeIds);
  if (perfumes.length !== new Set(perfumeIds).size) return { success: false, error: 'invalid_items' };

  for (const item of data.items) {
    const perfume = perfumes.find((entry) => entry.id === item.perfumeId)!;
    const variant = item.variantId ? perfume.variants.find((entry) => entry.id === item.variantId) : null;
    const target = variant ?? perfume;
    if (item.variantId && !variant) return { success: false, error: 'invalid_items' };
    if (
      ['OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED'].includes(target.availability) ||
      availableStock(target.stock, target.reservedStock) < item.quantity
    ) {
      return { success: false, error: 'out_of_stock', perfumeName: perfume.nameEn };
    }
  }

  const quotedDeliveryFee = await getDeliveryFee(data.deliveryCompanyId, data.city, data.area);
  if (quotedDeliveryFee == null) return { success: false, error: 'no_delivery' };

  const orderItems = data.items.map((item) => {
    const perfume = perfumes.find((entry) => entry.id === item.perfumeId)!;
    const variant = item.variantId ? perfume.variants.find((entry) => entry.id === item.variantId) : null;
    const price = Number(variant?.price ?? perfume.price);
    return {
      perfumeId: perfume.id,
      variantId: variant?.id,
      quantity: item.quantity,
      price,
      discount: 0,
      subtotal: price * item.quantity,
      productNameSnapshot: perfume.nameAr || perfume.nameEn,
      brandNameSnapshot: perfume.brand.nameAr || perfume.brand.name,
      skuSnapshot: variant?.sku ?? perfume.sku,
    };
  });
  const freeThreshold = await getFreeDeliveryThreshold();
  const totals = calculateCheckoutTotals(orderItems, quotedDeliveryFee, freeThreshold);

  const requestedCollectionIds = [...new Set(data.items.map((item) => item.collectionId).filter(Boolean) as string[])];
  const validCollections = requestedCollectionIds.length
    ? await prisma.collection.findMany({
        where: { id: { in: requestedCollectionIds }, ...publicCollectionWhere() },
        select: { id: true },
      })
    : [];
  const validCollectionIds = new Set(validCollections.map((collection) => collection.id));

  const createReservedOrder = () => prisma.$transaction(async (tx) => {
    // Re-read every stock target inside the serializable transaction. Prices and
    // totals came from the database and are never accepted from the browser.
    for (const item of data.items) {
      const target = item.variantId
        ? await tx.productVariant.findUnique({ where: { id: item.variantId } })
        : await tx.perfume.findUnique({ where: { id: item.perfumeId } });
      if (
        !target ||
        (item.variantId && 'perfumeId' in target && target.perfumeId !== item.perfumeId) ||
        ['OUT_OF_STOCK', 'HIDDEN', 'DISCONTINUED'].includes(target.availability) ||
        availableStock(target.stock, target.reservedStock) < item.quantity
      ) {
        throw new Error('OUT_OF_STOCK');
      }
    }

    const customer = await tx.customer.upsert({
      where: { phone: data.phone },
      update: {
        name: data.customerName,
        alternativePhone: data.alternativePhone,
        city: data.city,
        area: data.area,
        address: data.address,
        nearestLandmark: data.landmark,
        ...(userId ? { userId } : {}),
      },
      create: {
        userId,
        name: data.customerName,
        phone: data.phone,
        alternativePhone: data.alternativePhone,
        city: data.city,
        area: data.area,
        address: data.address,
        nearestLandmark: data.landmark,
      },
    });

    const created = await tx.order.create({
      data: {
        submissionId: data.submissionId,
        orderNumber: createOrderNumber(),
        userId,
        customerId: customer.id,
        customerName: data.customerName,
        phone: data.phone,
        customerNameSnapshot: data.customerName,
        customerPhoneSnapshot: data.phone,
        alternativePhone: data.alternativePhone,
        city: data.city,
        area: data.area,
        address: data.address,
        landmark: data.landmark,
        deliveryNotes: data.deliveryNotes,
        deliveryCompanyId: data.deliveryCompanyId,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        status: 'PENDING',
        items: { create: orderItems },
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: created.id, newStatus: 'PENDING', note: 'Order placed by customer' },
    });

    for (const item of data.items) {
      await applyInventoryMovement(tx, {
        perfumeId: item.perfumeId,
        variantId: item.variantId,
        stockDelta: 0,
        reservedDelta: item.quantity,
        quantityChanged: item.quantity,
        movementType: 'ORDER_RESERVED',
        reason: 'Stock reserved when customer placed order',
        orderId: created.id,
      });
    }

    const collectionPurchases = new Map<string, { revenue: number; perfumeIds: string[] }>();
    for (const item of data.items) {
      if (!item.collectionId || !validCollectionIds.has(item.collectionId)) continue;
      const pricedItem = orderItems.find((entry) => entry.perfumeId === item.perfumeId && entry.variantId === item.variantId)!;
      const existing = collectionPurchases.get(item.collectionId) ?? { revenue: 0, perfumeIds: [] };
      existing.revenue += pricedItem.subtotal;
      existing.perfumeIds.push(item.perfumeId);
      collectionPurchases.set(item.collectionId, existing);
    }
    const analyticsDate = new Date();
    analyticsDate.setUTCHours(0, 0, 0, 0);
    for (const [collectionId, attribution] of collectionPurchases) {
      await tx.collectionInteraction.createMany({
        data: attribution.perfumeIds.map((perfumeId) => ({ collectionId, perfumeId, userId, actionType: 'PURCHASE' as const })),
      });
      await tx.collectionDailyAnalytics.upsert({
        where: { collectionId_date: { collectionId, date: analyticsDate } },
        update: { purchases: { increment: 1 }, revenue: { increment: attribution.revenue } },
        create: { collectionId, date: analyticsDate, purchases: 1, revenue: attribution.revenue },
      });
    }

    if (userId) {
      await tx.user.update({
        where: { id: userId },
        data: { orderCount: { increment: 1 }, totalSpending: { increment: totals.total } },
      });
    }
    await tx.customer.update({
      where: { id: customer.id },
      data: { orderCount: { increment: 1 }, totalSpending: { increment: totals.total } },
    });
    const priorEvent = data.analyticsSessionId
      ? await tx.analyticsEvent.findFirst({
          where: { sessionId: data.analyticsSessionId },
          orderBy: { createdAt: 'desc' },
          select: { source: true, sourceDetail: true, device: true, pathname: true },
        })
      : null;
    await tx.analyticsEvent.create({
      data: {
        eventType: 'ORDER_PLACED',
        sessionId: data.analyticsSessionId,
        userId,
        customerId: customer.id,
        orderId: created.id,
        value: totals.total,
        source: priorEvent?.source ?? 'DIRECT',
        sourceDetail: priorEvent?.sourceDetail,
        device: priorEvent?.device ?? 'UNKNOWN',
        pathname: priorEvent?.pathname,
      },
    });
    await tx.dailyAnalytics.upsert({
      where: { date: analyticsDate },
      update: { orders: { increment: 1 } },
      create: { date: analyticsDate, orders: 1 },
    });
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  let order;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      order = await createReservedOrder();
      break;
    } catch (error) {
      if (error instanceof Error && error.message === 'OUT_OF_STOCK') {
        return { success: false, error: 'out_of_stock', perfumeName: 'Selected perfume' };
      }
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2)) throw error;
    }
  }
  if (!order) return { success: false, error: 'server_error' };
  return { success: true, orderId: order.id, confirmationToken: orderConfirmationToken(order.id) };
}
