'use server';

import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { applyInventoryMovement, availableStock, inventoryStatus } from '@/services/inventory.service';
import { enforceRateLimit, requestSecurityKey } from '@/lib/security';

const adjustmentSchema = z.object({
  perfumeId: z.string().min(1),
  variantId: z.string().optional(),
  type: z.enum(['ADD', 'REDUCE', 'CORRECT', 'DAMAGED', 'MISSING', 'RETURN', 'INITIAL']),
  quantity: z.number().int().min(0).max(100000),
  reason: z.string().min(3).max(160),
  adminNote: z.string().min(3).max(500),
});

async function requireAdmin() {
  return (await requirePermission('inventory.adjust')).id;
}

function refreshInventory(slug?: string) {
  revalidatePath('/studio/inventory');
  revalidatePath('/studio/products');
  revalidatePath('/studio');
  revalidatePath('/sitemap.xml');
  revalidatePath('/ar/shop');
  revalidatePath('/en/shop');
  revalidatePath('/ar');
  revalidatePath('/en');
  if (slug) {
    revalidatePath(`/ar/product/${slug}`);
    revalidatePath(`/en/product/${slug}`);
  }
}

export async function adjustInventory(input: z.input<typeof adjustmentSchema>) {
  const adminId = await requireAdmin();
  const data = adjustmentSchema.parse(input);
  const product = await prisma.perfume.findUniqueOrThrow({ where: { id: data.perfumeId }, select: { nameEn: true, slug: true } });

  await prisma.$transaction(async (tx) => {
    const target = data.variantId
      ? await tx.productVariant.findFirstOrThrow({ where: { id: data.variantId, perfumeId: data.perfumeId } })
      : await tx.perfume.findUniqueOrThrow({ where: { id: data.perfumeId } });
    const movement = {
      ADD: ['MANUAL_ADDITION', data.quantity],
      REDUCE: ['MANUAL_REDUCTION', -data.quantity],
      CORRECT: ['STOCK_CORRECTION', data.quantity - target.stock],
      DAMAGED: ['DAMAGED_PRODUCT', -data.quantity],
      MISSING: ['MISSING_PRODUCT', -data.quantity],
      RETURN: ['RETURN_TO_STOCK', data.quantity],
      INITIAL: ['INITIAL_STOCK', data.quantity - target.stock],
    } as const;
    const [movementType, stockDelta] = movement[data.type];
    await applyInventoryMovement(tx, {
      perfumeId: data.perfumeId,
      variantId: data.variantId,
      stockDelta,
      reservedDelta: 0,
      quantityChanged: stockDelta,
      movementType,
      reason: data.reason,
      adminNote: data.adminNote,
      adminId,
    });
    await tx.activityLog.create({
      data: { adminId, action: `inventory.${data.type.toLowerCase()}`, affectedType: data.variantId ? 'ProductVariant' : 'Perfume', affectedId: data.variantId ?? data.perfumeId, affectedName: product.nameEn },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  refreshInventory(product.slug);
}

export async function setInventoryAvailability(
  perfumeId: string,
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'HIDDEN' | 'DISCONTINUED'
) {
  const adminId = await requireAdmin();
  const product = await prisma.perfume.findUniqueOrThrow({ where: { id: perfumeId } });
  if (availability === 'IN_STOCK' && availableStock(product.stock, product.reservedStock) <= 0) throw new Error('Add stock before marking this product in stock');
  const nextStatus = inventoryStatus({ ...product, availability });
  await prisma.$transaction([
    prisma.perfume.update({ where: { id: perfumeId }, data: { availability, availableStock: availableStock(product.stock, product.reservedStock), inventoryStatus: nextStatus, inventoryUpdatedAt: new Date() } }),
    prisma.inventoryMovement.create({
      data: {
        perfumeId, adminId, previousStock: product.stock, newStock: product.stock,
        previousReserved: product.reservedStock, newReserved: product.reservedStock,
        quantityChanged: 0,
        movementType: availability === 'DISCONTINUED' ? 'DISCONTINUED_PRODUCT' : 'STOCK_CORRECTION',
        reason: `Availability changed to ${availability.replaceAll('_', ' ')}`,
        adminNote: 'Manual availability control from Inventory Manager',
      },
    }),
    prisma.activityLog.create({ data: { adminId, action: `inventory.availability.${availability.toLowerCase()}`, affectedType: 'Perfume', affectedId: perfumeId, affectedName: product.nameEn } }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  refreshInventory(product.slug);
}

export async function updateInventorySettings(input: {
  perfumeId: string;
  lowStockThreshold: number;
  warehouseLocation?: string;
}) {
  const adminId = await requireAdmin();
  const lowStockThreshold = Math.max(0, Math.min(100000, Math.trunc(input.lowStockThreshold)));
  const current = await prisma.perfume.findUniqueOrThrow({ where: { id: input.perfumeId } });
  const product = await prisma.perfume.update({
    where: { id: input.perfumeId },
    data: {
      lowStockThreshold,
      warehouseLocation: input.warehouseLocation?.trim().slice(0, 100) || null,
      availableStock: availableStock(current.stock, current.reservedStock),
      inventoryStatus: inventoryStatus({ ...current, lowStockThreshold }),
      inventoryUpdatedAt: new Date(),
    },
  });
  await prisma.activityLog.create({ data: { adminId, action: 'inventory.settings.updated', affectedType: 'Perfume', affectedId: product.id, affectedName: product.nameEn } });
  refreshInventory(product.slug);
}

export async function createProductVariant(input: {
  perfumeId: string;
  name: string;
  bottleSize?: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  warehouseLocation?: string;
}) {
  const adminId = await requireAdmin();
  const product = await prisma.perfume.findUniqueOrThrow({ where: { id: input.perfumeId }, select: { nameEn: true, slug: true } });
  const name = input.name.trim().slice(0, 80);
  const sku = input.sku.trim().slice(0, 80);
  const stock = Math.max(0, Math.trunc(input.stock));
  if (!name || !sku || !Number.isFinite(input.price) || input.price < 0) throw new Error('Complete the required variant fields');
  await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.create({ data: {
      perfumeId: input.perfumeId, name, bottleSize: input.bottleSize?.trim() || null,
      sku, barcode: input.barcode?.trim() || null, price: input.price,
      costPrice: input.costPrice != null && input.costPrice >= 0 ? input.costPrice : null,
      stock: 0, lowStockThreshold: Math.max(0, Math.trunc(input.lowStockThreshold)),
      warehouseLocation: input.warehouseLocation?.trim() || null,
      availability: stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      availableStock: 0,
      inventoryStatus: 'OUT_OF_STOCK',
    } });
    if (stock > 0) await applyInventoryMovement(tx, {
      perfumeId: input.perfumeId, variantId: variant.id, stockDelta: stock, reservedDelta: 0,
      quantityChanged: stock, movementType: 'INITIAL_STOCK', reason: 'Initial variant stock',
      adminNote: 'Variant created in Inventory Manager', adminId,
    });
    await tx.activityLog.create({ data: { adminId, action: 'inventory.variant.created', affectedType: 'ProductVariant', affectedId: variant.id, affectedName: `${product.nameEn} · ${name}` } });
    await tx.perfume.update({ where: { id: input.perfumeId }, data: { inventoryUpdatedAt: new Date() } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  refreshInventory(product.slug);
}

export async function setVariantAvailability(
  variantId: string,
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'HIDDEN' | 'DISCONTINUED'
) {
  const adminId = await requireAdmin();
  const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId }, include: { perfume: { select: { nameEn: true, slug: true } } } });
  if (availability === 'IN_STOCK' && availableStock(variant.stock, variant.reservedStock) <= 0) throw new Error('Add stock before marking this variant in stock');
  const nextStatus = inventoryStatus({ ...variant, availability });
  await prisma.$transaction([
    prisma.productVariant.update({ where: { id: variantId }, data: { availability, availableStock: availableStock(variant.stock, variant.reservedStock), inventoryStatus: nextStatus } }),
    prisma.inventoryMovement.create({ data: {
      perfumeId: variant.perfumeId, variantId, adminId, previousStock: variant.stock, newStock: variant.stock,
      previousReserved: variant.reservedStock, newReserved: variant.reservedStock, quantityChanged: 0,
      movementType: availability === 'DISCONTINUED' ? 'DISCONTINUED_PRODUCT' : 'STOCK_CORRECTION',
      reason: `Variant availability changed to ${availability}`, adminNote: 'Manual variant availability control',
    } }),
    prisma.perfume.update({ where: { id: variant.perfumeId }, data: { inventoryUpdatedAt: new Date() } }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  refreshInventory(variant.perfume.slug);
}

export async function bulkInventoryAction(input: {
  perfumeIds: string[];
  action: 'ADD' | 'REDUCE' | 'LOW_LIMIT' | 'OUT_OF_STOCK' | 'HIDDEN' | 'IN_STOCK' | 'DISCONTINUED' | 'PRICE_PERCENT';
  value: number;
  note: string;
}) {
  const adminId = await requireAdmin();
  const ids = [...new Set(input.perfumeIds)].slice(0, 500);
  if (!ids.length || input.note.trim().length < 3) throw new Error('Select products and provide an audit note');
  const products = await prisma.perfume.findMany({ where: { id: { in: ids } } });
  await prisma.$transaction(async (tx) => {
    for (const product of products) {
      if (input.action === 'ADD' || input.action === 'REDUCE') {
        const amount = Math.max(0, Math.trunc(input.value));
        await applyInventoryMovement(tx, {
          perfumeId: product.id, stockDelta: input.action === 'ADD' ? amount : -amount,
          reservedDelta: 0, quantityChanged: input.action === 'ADD' ? amount : -amount,
          movementType: input.action === 'ADD' ? 'MANUAL_ADDITION' : 'MANUAL_REDUCTION',
          reason: 'Bulk inventory adjustment', adminNote: input.note.trim(), adminId,
        });
      } else if (input.action === 'LOW_LIMIT') {
        const lowStockThreshold = Math.max(0, Math.trunc(input.value));
        await tx.perfume.update({ where: { id: product.id }, data: { lowStockThreshold, availableStock: availableStock(product.stock, product.reservedStock), inventoryStatus: inventoryStatus({ ...product, lowStockThreshold }), inventoryUpdatedAt: new Date() } });
      } else if (input.action === 'PRICE_PERCENT') {
        const factor = 1 + input.value / 100;
        if (factor <= 0) throw new Error('Invalid price percentage');
        await tx.perfume.update({ where: { id: product.id }, data: { price: Number(product.price) * factor, inventoryUpdatedAt: new Date() } });
      } else {
        const availability = input.action as 'IN_STOCK' | 'OUT_OF_STOCK' | 'HIDDEN' | 'DISCONTINUED';
        if (availability === 'IN_STOCK' && availableStock(product.stock, product.reservedStock) <= 0) continue;
        await tx.perfume.update({ where: { id: product.id }, data: { availability, availableStock: availableStock(product.stock, product.reservedStock), inventoryStatus: inventoryStatus({ ...product, availability }), inventoryUpdatedAt: new Date() } });
        await tx.inventoryMovement.create({ data: {
          perfumeId: product.id, adminId, previousStock: product.stock, newStock: product.stock,
          previousReserved: product.reservedStock, newReserved: product.reservedStock, quantityChanged: 0,
          movementType: availability === 'DISCONTINUED' ? 'DISCONTINUED_PRODUCT' : 'STOCK_CORRECTION',
          reason: `Bulk availability change to ${availability}`, adminNote: input.note.trim(),
        } });
      }
      await tx.activityLog.create({ data: { adminId, action: `inventory.bulk.${input.action.toLowerCase()}`, affectedType: 'Perfume', affectedId: product.id, affectedName: product.nameEn } });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  refreshInventory();
}

function csvRows(text: string) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const split = (line: string) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((cell) => cell.trim().replace(/^\"|\"$/g, '').replace(/\"\"/g, '\"'));
  const headers = split(lines[0]).map((header) => header.toLowerCase());
  return lines.slice(1).map((line) => Object.fromEntries(split(line).map((cell, index) => [headers[index], cell])));
}

export type InventoryImportState = { success?: number; error?: string };

export async function importInventory(_state: InventoryImportState, formData: FormData): Promise<InventoryImportState> {
  const adminId = (await requirePermission('inventory.import')).id;
  const file = formData.get('file');
  const extension = file instanceof File ? file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] : undefined;
  const allowedTypes = new Set(['text/csv', 'application/json', 'text/json', 'application/vnd.ms-excel', 'application/xml', 'text/xml', '']);
  if (!(file instanceof File) || file.size <= 0 || file.size > 5 * 1024 * 1024 || !extension || !['csv', 'json', 'xls', 'xml'].includes(extension) || !allowedTypes.has(file.type)) return { error: 'Choose a valid CSV, JSON, or exported Excel XML file smaller than 5 MB.' };
  try {
    const text = await file.text();
    let rows: Record<string, unknown>[];
    if (file.name.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : [];
    } else if (text.includes('<Workbook')) {
      const cells = [...text.matchAll(/<Row>([\s\S]*?)<\/Row>/g)].map((row) => [...row[1].matchAll(/<Data[^>]*>([\s\S]*?)<\/Data>/g)].map((cell) => cell[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')));
      const headers = (cells.shift() ?? []).map((header) => header.toLowerCase());
      rows = cells.map((cellsRow) => Object.fromEntries(cellsRow.map((cell, index) => [headers[index], cell])));
    } else rows = csvRows(text);
    let updated = 0;
    for (const row of rows.slice(0, 1000)) {
      const sku = String(row.sku ?? '').trim();
      const product = await prisma.perfume.findUnique({ where: { sku } });
      const variant = product ? null : await prisma.productVariant.findUnique({ where: { sku }, include: { perfume: { select: { id: true } } } });
      const target = product ?? variant;
      if (!target) continue;
      const perfumeId = product?.id ?? variant!.perfume.id;
      const stock = Number(row.stock ?? target.stock);
      const limit = Number(row.lowstocklimit ?? row.low_stock_limit ?? target.lowStockThreshold);
      if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(limit) || limit < 0) continue;
      await prisma.$transaction(async (tx) => {
        if (stock !== target.stock) await applyInventoryMovement(tx, {
          perfumeId, variantId: variant?.id, stockDelta: stock - target.stock, reservedDelta: 0,
          quantityChanged: stock - target.stock, movementType: 'STOCK_CORRECTION',
          reason: 'Inventory import', adminNote: `Imported from ${file.name}`, adminId,
        });
        const nextStock = stock;
        const snapshot = {
          lowStockThreshold: limit,
          warehouseLocation: String(row.warehouselocation ?? row.warehouse_location ?? target.warehouseLocation ?? '').trim() || null,
          availableStock: availableStock(nextStock, target.reservedStock),
          inventoryStatus: inventoryStatus({ ...target, stock: nextStock, lowStockThreshold: limit }),
          ...(product ? { inventoryUpdatedAt: new Date() } : {}),
        };
        if (variant) await tx.productVariant.update({ where: { id: variant.id }, data: snapshot });
        else await tx.perfume.update({ where: { id: product!.id }, data: snapshot });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      updated += 1;
    }
    refreshInventory();
    return { success: updated };
  } catch {
    return { error: 'The import could not be read. Use the exported template and keep SKU values unchanged.' };
  }
}

export async function resolveInventoryNotification(notificationId: string) {
  const adminId = await requireAdmin();
  await prisma.inventoryNotification.update({ where: { id: notificationId }, data: { resolvedAt: new Date(), resolvedById: adminId } });
  revalidatePath('/studio');
  revalidatePath('/studio/inventory');
}

export type StockAlertState = { success?: boolean; error?: string };

export async function requestStockAlert(_state: StockAlertState, formData: FormData): Promise<StockAlertState> {
  try { await enforceRateLimit('stock-alert.request', requestSecurityKey(headers()), 8, 60 * 60 * 1000); } catch { return { error: 'validation' }; }
  const perfumeId = String(formData.get('perfumeId') ?? '');
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  if (!perfumeId || (!/^\+?[0-9\s-]{7,20}$/.test(phone) && !/^\S+@\S+\.\S+$/.test(email))) return { error: 'validation' };
  try {
    await prisma.stockAlertSubscription.create({ data: { perfumeId, phone: phone || null, email: email || null } });
  } catch {
    // Duplicate subscriptions intentionally return success to avoid leaking state.
  }
  return { success: true };
}
