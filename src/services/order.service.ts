import { Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { applyInventoryMovement, availableStock } from '@/services/inventory.service';

export const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: ['PENDING', 'CONFIRMED'],
  RETURNED: [],
};

export function canTransitionOrder(from: OrderStatusValue, to: OrderStatusValue) {
  return from === to || ALLOWED_ORDER_TRANSITIONS[from].includes(to);
}

export function assertOrderTransition(from: OrderStatusValue, to: OrderStatusValue) {
  if (!canTransitionOrder(from, to)) throw new ConflictError(`Cannot move an order from ${from} to ${to}.`);
}

type AdminActor = { id: string; name: string | null; email: string };

export async function changeOrderStatus(input: {
  orderId: string;
  newStatus: OrderStatusValue;
  note?: string;
  returnToStock: boolean;
  admin: AdminActor;
}) {
  const { orderId, newStatus, note, returnToStock, admin } = input;
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { perfume: { select: { slug: true } } } } },
    });
    if (!order) throw new NotFoundError('Order');
    if (order.status === newStatus) return { changed: false, order };
    assertOrderTransition(order.status, newStatus);

    let inventoryState = order.inventoryState;
    if (['SHIPPED', 'DELIVERED'].includes(newStatus) && ['RELEASED', 'RETURNED'].includes(inventoryState)) {
      throw new ConflictError('This order no longer holds inventory and must be reopened before shipping.');
    }

    if (inventoryState === 'RELEASED' && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(newStatus)) {
      for (const item of order.items) {
        const target = item.variantId
          ? await tx.productVariant.findUnique({ where: { id: item.variantId } })
          : await tx.perfume.findUnique({ where: { id: item.perfumeId } });
        if (!target) throw new NotFoundError('Inventory item');
        if (availableStock(target.stock, target.reservedStock) < item.quantity) {
          throw new ConflictError('Insufficient stock to reopen order.');
        }
        await applyInventoryMovement(tx, {
          perfumeId: item.perfumeId, variantId: item.variantId, stockDelta: 0,
          reservedDelta: item.quantity, quantityChanged: item.quantity,
          movementType: 'ORDER_RESERVED', reason: 'Stock re-reserved when order was reopened',
          orderId, adminId: admin.id, adminNote: note,
        });
      }
      inventoryState = 'RESERVED';
    }

    if (['SHIPPED', 'DELIVERED'].includes(newStatus) && inventoryState === 'RESERVED') {
      for (const item of order.items) {
        await applyInventoryMovement(tx, {
          perfumeId: item.perfumeId, variantId: item.variantId,
          stockDelta: -item.quantity, reservedDelta: -item.quantity,
          quantityChanged: -item.quantity, movementType: 'ORDER_SHIPPED',
          reason: newStatus === 'DELIVERED' ? 'Stock finalized when order was delivered' : 'Physical stock deducted when order was shipped',
          orderId, adminId: admin.id, adminNote: note,
        });
        await tx.perfume.update({ where: { id: item.perfumeId }, data: { purchaseCount: { increment: item.quantity } } });
      }
      inventoryState = 'DEDUCTED';
    }

    if (newStatus === 'CANCELLED') {
      if (inventoryState === 'DEDUCTED') throw new ConflictError('A shipped order must be returned, not cancelled.');
      if (inventoryState === 'RESERVED') {
        for (const item of order.items) {
          await applyInventoryMovement(tx, {
            perfumeId: item.perfumeId, variantId: item.variantId, stockDelta: 0,
            reservedDelta: -item.quantity, quantityChanged: -item.quantity,
            movementType: 'ORDER_CANCELLED', reason: 'Reserved stock released after order cancellation',
            orderId, adminId: admin.id, adminNote: note,
          });
        }
        inventoryState = 'RELEASED';
      }
    }

    if (newStatus === 'RETURNED') {
      if (inventoryState !== 'DEDUCTED') throw new ConflictError('Only shipped or delivered inventory can be returned.');
      for (const item of order.items) {
        await applyInventoryMovement(tx, {
          perfumeId: item.perfumeId, variantId: item.variantId,
          stockDelta: returnToStock ? item.quantity : 0, reservedDelta: 0,
          quantityChanged: returnToStock ? item.quantity : 0,
          movementType: 'ORDER_RETURNED',
          reason: returnToStock ? 'Returned product inspected and restored to sellable stock' : 'Returned product not restored to sellable stock',
          orderId, adminId: admin.id, adminNote: note,
        });
        if (returnToStock) {
          await tx.perfume.updateMany({
            where: { id: item.perfumeId, purchaseCount: { gte: item.quantity } },
            data: { purchaseCount: { decrement: item.quantity } },
          });
        }
      }
      inventoryState = returnToStock ? 'RETURNED' : 'RELEASED';
    }

    const reopeningCancelledOrder = order.status === 'CANCELLED' && ['PENDING', 'CONFIRMED'].includes(newStatus);
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        inventoryState,
        ...(newStatus === 'CANCELLED' ? { cancelledAt: new Date() } : reopeningCancelledOrder ? { cancelledAt: null } : {}),
        ...(newStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, previousStatus: order.status, newStatus, adminId: admin.id, note },
    });

    const eventTypes: Partial<Record<OrderStatusValue, 'ORDER_CONFIRMED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED' | 'ORDER_RETURNED'>> = {
      CONFIRMED: 'ORDER_CONFIRMED', DELIVERED: 'ORDER_DELIVERED', CANCELLED: 'ORDER_CANCELLED', RETURNED: 'ORDER_RETURNED',
    };
    const eventType = eventTypes[newStatus];
    if (eventType) {
      const placedEvent = await tx.analyticsEvent.findFirst({
        where: { orderId, eventType: 'ORDER_PLACED' },
        select: { sessionId: true, source: true, sourceDetail: true, device: true, pathname: true },
      });
      await tx.analyticsEvent.create({
        data: {
          eventType, orderId, userId: order.userId, sessionId: placedEvent?.sessionId,
          source: placedEvent?.source ?? 'DIRECT', sourceDetail: placedEvent?.sourceDetail,
          device: placedEvent?.device ?? 'UNKNOWN', pathname: placedEvent?.pathname, value: order.total,
        },
      });
    }
    return { changed: true, order };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  if (result.changed) {
    const previousValue = { status: result.order.status, inventoryState: result.order.inventoryState };
    const newValue = { status: newStatus };
    await prisma.$transaction([
      prisma.activityLog.create({ data: {
        adminId: admin.id,
        actorName: admin.name ?? admin.email,
        action: `order.status.${newStatus.toLowerCase()}`,
        affectedType: 'Order',
        affectedId: orderId,
        affectedName: `#${orderId.slice(0, 8).toUpperCase()}`,
        previousValue,
        newValue,
      } }),
      prisma.auditLog.create({ data: {
        adminId: admin.id,
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'Order',
        entityId: orderId,
        previousValue,
        newValue,
      } }),
    ]);
  }
  return { changed: result.changed, productSlugs: result.order.items.map((item) => item.perfume.slug) };
}

export async function saveOrderInternalNote(input: { orderId: string; note: string; admin: AdminActor }) {
  const order = await prisma.order.update({ where: { id: input.orderId }, data: { internalNotes: input.note }, select: { id: true } });
  await prisma.activityLog.create({
    data: {
      adminId: input.admin.id,
      actorName: input.admin.name ?? input.admin.email,
      action: 'order.internal_note.updated',
      affectedType: 'Order',
      affectedId: order.id,
      affectedName: `#${order.id.slice(0, 8).toUpperCase()}`,
    },
  });
}
