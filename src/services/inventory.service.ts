import type { Availability, AvailabilityStatus, InventoryMovementType, Prisma } from '@prisma/client';

export type InventoryStatusLabel = AvailabilityStatus;

export function availableStock(stock: number, reservedStock: number) {
  return Math.max(0, stock - reservedStock);
}

export function inventoryStatus(input: {
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  availability: Availability;
}): InventoryStatusLabel {
  if (input.availability === 'HIDDEN') return 'HIDDEN';
  if (input.availability === 'DISCONTINUED') return 'DISCONTINUED';
  const available = availableStock(input.stock, input.reservedStock);
  if (available === 0 && input.reservedStock > 0) return 'RESERVED';
  if (available === 0 || input.availability === 'OUT_OF_STOCK') return 'OUT_OF_STOCK';
  if (available <= input.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

function automaticAvailability(current: Availability, stock: number, reserved: number): Availability {
  if (current === 'HIDDEN' || current === 'DISCONTINUED' || current === 'PREORDER') return current;
  return availableStock(stock, reserved) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
}

async function syncAlerts(
  tx: Prisma.TransactionClient,
  input: { perfumeId: string; productName: string; stock: number; reserved: number; threshold: number }
) {
  const available = availableStock(input.stock, input.reserved);
  const wanted = new Map<string, { title: string; message: string }>();
  if (available === 0) {
    wanted.set('OUT_OF_STOCK', {
      title: `${input.productName} is out of stock`,
      message: `No units are currently available (${input.reserved} reserved).`,
    });
  } else if (available <= input.threshold) {
    wanted.set('LOW_STOCK', {
      title: `${input.productName} is low in stock`,
      message: `Only ${available} unit${available === 1 ? '' : 's'} available.`,
    });
  }
  if (input.reserved > 0 && input.reserved >= Math.max(2, Math.ceil(input.stock * 0.6))) {
    wanted.set('HIGH_RESERVED', {
      title: `${input.productName} has high reserved stock`,
      message: `${input.reserved} of ${input.stock} physical units are reserved for active orders.`,
    });
  }
  const productSignals = await tx.perfume.findUnique({ where: { id: input.perfumeId }, select: { viewCount: true, wishlistCount: true } });
  if (available === 0 && (productSignals?.viewCount ?? 0) >= 100) {
    wanted.set('HIGH_VIEWS_NO_STOCK', { title: `${input.productName} has demand but no stock`, message: `${productSignals?.viewCount ?? 0} product views have been recorded while inventory is unavailable.` });
  }
  const recentShipped = await tx.inventoryMovement.aggregate({
    where: { perfumeId: input.perfumeId, movementType: 'ORDER_SHIPPED', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    _sum: { quantityChanged: true },
  });
  if (available <= input.threshold && Math.abs(recentShipped._sum.quantityChanged ?? 0) >= 5) {
    wanted.set('FAST_MOVING_RESTOCK', { title: `${input.productName} needs restocking soon`, message: `It is selling quickly and only ${available} units remain available.` });
  }

  const active = await tx.inventoryNotification.findMany({
    where: { perfumeId: input.perfumeId, resolvedAt: null, type: { in: ['LOW_STOCK', 'OUT_OF_STOCK', 'HIGH_RESERVED', 'HIGH_VIEWS_NO_STOCK', 'FAST_MOVING_RESTOCK'] } },
    select: { id: true, type: true },
  });
  for (const alert of active) {
    if (!wanted.has(alert.type)) {
      await tx.inventoryNotification.update({ where: { id: alert.id }, data: { resolvedAt: new Date() } });
    }
  }
  for (const [type, content] of wanted) {
    if (active.some((alert) => alert.type === type)) continue;
    await tx.inventoryNotification.create({
      data: {
        perfumeId: input.perfumeId,
        type: type as 'LOW_STOCK' | 'OUT_OF_STOCK' | 'HIGH_RESERVED' | 'HIGH_VIEWS_NO_STOCK' | 'FAST_MOVING_RESTOCK',
        title: content.title,
        message: content.message,
      },
    });
  }
}

export async function applyInventoryMovement(
  tx: Prisma.TransactionClient,
  input: {
    perfumeId: string;
    variantId?: string | null;
    stockDelta: number;
    reservedDelta: number;
    quantityChanged: number;
    movementType: InventoryMovementType;
    reason: string;
    adminNote?: string | null;
    adminId?: string | null;
    orderId?: string | null;
  }
) {
  const variant = input.variantId
    ? await tx.productVariant.findUniqueOrThrow({ where: { id: input.variantId }, include: { perfume: { select: { id: true, nameEn: true } } } })
    : null;
  const product = variant ? null : await tx.perfume.findUniqueOrThrow({ where: { id: input.perfumeId } });
  const target = variant ?? product!;
  const perfumeId = variant ? variant.perfume.id : product!.id;
  if (perfumeId !== input.perfumeId) throw new Error('Inventory target does not match product');

  const newStock = target.stock + input.stockDelta;
  const newReserved = target.reservedStock + input.reservedDelta;
  if (newStock < 0 || newReserved < 0 || newReserved > newStock) {
    throw new Error('Insufficient available inventory');
  }
  const availability = automaticAvailability(target.availability, newStock, newReserved);
  const nextAvailable = availableStock(newStock, newReserved);
  const nextStatus = inventoryStatus({ stock: newStock, reservedStock: newReserved, lowStockThreshold: target.lowStockThreshold, availability });
  if (input.variantId) {
    await tx.productVariant.update({ where: { id: input.variantId }, data: { stock: newStock, reservedStock: newReserved, availableStock: nextAvailable, availability, inventoryStatus: nextStatus } });
    await tx.perfume.update({ where: { id: input.perfumeId }, data: { inventoryUpdatedAt: new Date() } });
  } else {
    await tx.perfume.update({ where: { id: input.perfumeId }, data: { stock: newStock, reservedStock: newReserved, availableStock: nextAvailable, availability, inventoryStatus: nextStatus, inventoryUpdatedAt: new Date() } });
  }
  await tx.inventoryMovement.create({
    data: {
      perfumeId: input.perfumeId,
      variantId: input.variantId,
      orderId: input.orderId,
      adminId: input.adminId,
      previousStock: target.stock,
      newStock,
      previousReserved: target.reservedStock,
      newReserved,
      quantityChanged: input.quantityChanged,
      movementType: input.movementType,
      reason: input.reason,
      adminNote: input.adminNote,
    },
  });
  await syncAlerts(tx, {
    perfumeId: input.perfumeId,
    productName: variant ? `${variant.perfume.nameEn} · ${variant.name}` : product!.nameEn,
    stock: newStock,
    reserved: newReserved,
    threshold: target.lowStockThreshold,
  });
  return { stock: newStock, reservedStock: newReserved, available: nextAvailable };
}
