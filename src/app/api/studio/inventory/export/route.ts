import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function xml(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export async function GET(request: NextRequest) {
  try {
  const admin = await requirePermission('inventory.export');
  const products = await prisma.perfume.findMany({
    orderBy: { nameEn: 'asc' },
    include: { brand: { select: { name: true } }, category: { select: { nameEn: true } }, variants: { orderBy: { bottleSize: 'asc' } } },
  });
  const rows = products.flatMap((product) => {
    const base = {
      Product: product.nameEn, Brand: product.brand.name, Category: product.category?.nameEn ?? '',
      SKU: product.sku, Barcode: product.barcode ?? '', Variant: '', BottleSize: product.bottleSize ?? '',
      Stock: product.stock, ReservedStock: product.reservedStock, AvailableStock: product.availableStock,
      LowStockLimit: product.lowStockThreshold, Status: product.inventoryStatus,
      Availability: product.availability, SellingPrice: product.price.toString(), CostPrice: product.costPrice?.toString() ?? '',
      WarehouseLocation: product.warehouseLocation ?? '', LastUpdated: product.updatedAt.toISOString(),
    };
    return [base, ...product.variants.map((variant) => ({
      ...base, SKU: variant.sku, Barcode: variant.barcode ?? '', Variant: variant.name,
      BottleSize: variant.bottleSize ?? '', Stock: variant.stock, ReservedStock: variant.reservedStock,
      AvailableStock: variant.availableStock, LowStockLimit: variant.lowStockThreshold,
      Status: variant.inventoryStatus, Availability: variant.availability,
      SellingPrice: variant.price.toString(), CostPrice: variant.costPrice?.toString() ?? '',
      WarehouseLocation: variant.warehouseLocation ?? '', LastUpdated: variant.updatedAt.toISOString(),
    }))];
  });
  const format = request.nextUrl.searchParams.get('format') ?? 'csv';
  await prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: 'inventory.exported', affectedType: 'InventoryExport', affectedId: `inventory-${Date.now()}`, affectedName: format, metadata: { rowCount: rows.length } } });
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'json') {
    return new NextResponse(JSON.stringify(rows, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="scentiq-inventory-${stamp}.json"` } });
  }
  const headers = Object.keys(rows[0] ?? { SKU: '', Stock: '' });
  if (format === 'excel') {
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Inventory"><Table><Row>${headers.map((header) => `<Cell><Data ss:Type="String">${xml(header)}</Data></Cell>`).join('')}</Row>${rows.map((row) => `<Row>${headers.map((header) => `<Cell><Data ss:Type="String">${xml(row[header as keyof typeof row])}</Data></Cell>`).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
    return new NextResponse(workbook, { headers: { 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': `attachment; filename="scentiq-inventory-${stamp}.xls"` } });
  }
  const csv = `\uFEFF${headers.join(',')}\n${rows.map((row) => headers.map((header) => csvCell(row[header as keyof typeof row])).join(',')).join('\n')}`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="scentiq-inventory-${stamp}.csv"` } });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
