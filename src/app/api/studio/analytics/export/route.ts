import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { requirePermission } from '@/lib/authorization';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { getBusinessAnalytics, resolveAnalyticsRange } from '@/services/analytics.service';

export const runtime = 'nodejs';

const REPORTS = ['orders', 'revenue', 'inventory', 'products', 'search', 'customers'] as const;
type Report = (typeof REPORTS)[number];

function safeText(value: unknown) {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function csvCell(value: unknown) {
  const text = safeText(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function xml(value: unknown) {
  return safeText(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function exportResponse(rows: Record<string, unknown>[], report: Report, format: string) {
  const headers = Object.keys(rows[0] ?? { Message: 'No data in selected period' });
  const normalizedRows = rows.length ? rows : [{ Message: 'No data in selected period' }];
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'excel') {
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${xml(report)}"><Table><Row>${headers.map((header) => `<Cell><Data ss:Type="String">${xml(header)}</Data></Cell>`).join('')}</Row>${normalizedRows.map((row) => `<Row>${headers.map((header) => `<Cell><Data ss:Type="String">${xml(row[header])}</Data></Cell>`).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
    return new NextResponse(workbook, { headers: { 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': `attachment; filename="scentiq-${report}-${stamp}.xls"` } });
  }
  const csv = `\uFEFF${headers.map(csvCell).join(',')}\n${normalizedRows.map((row) => headers.map((header) => csvCell(row[header])).join(',')).join('\n')}`;
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="scentiq-${report}-${stamp}.csv"` } });
}

export async function GET(request: NextRequest) {
  try {
  const requested = request.nextUrl.searchParams.get('report');
  if (!REPORTS.includes(requested as Report)) throw new ValidationError('Unknown report.');
  const report = requested as Report;
  const admin = await requirePermission(report === 'inventory' ? 'inventory.export' : 'analytics.export');
  const format = request.nextUrl.searchParams.get('format') === 'excel' ? 'excel' : 'csv';
  const range = resolveAnalyticsRange({
    range: request.nextUrl.searchParams.get('range') ?? undefined,
    from: request.nextUrl.searchParams.get('from') ?? undefined,
    to: request.nextUrl.searchParams.get('to') ?? undefined,
  });
  let rows: Record<string, unknown>[] = [];

  if (report === 'orders' || report === 'revenue') {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: range.start, lt: range.end }, ...(report === 'revenue' ? { status: 'DELIVERED' as const } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { deliveryCompany: { select: { name: true } }, items: { select: { quantity: true } } },
    });
    rows = orders.map((order) => ({
      Order: order.id, CreatedAt: order.createdAt.toISOString(), Status: order.status,
      Customer: order.customerName, Phone: order.phone, City: order.city, Area: order.area ?? '',
      DeliveryCompany: order.deliveryCompany?.name ?? '', Items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      Subtotal: order.subtotal.toString(), DeliveryFee: order.deliveryFee.toString(), Total: order.total.toString(),
      RevenueRecognition: order.status === 'DELIVERED' ? 'Recognized' : 'Not recognized',
    }));
  } else if (report === 'inventory') {
    const products = await prisma.perfume.findMany({ orderBy: { nameEn: 'asc' }, include: { brand: { select: { name: true } }, category: { select: { nameEn: true } }, variants: true } });
    rows = products.flatMap((product) => [{
      Product: product.nameEn, Brand: product.brand.name, Category: product.category?.nameEn ?? '', Variant: '', SKU: product.sku,
      PhysicalStock: product.stock, ReservedStock: product.reservedStock, AvailableStock: product.availableStock,
      Status: product.inventoryStatus, SellingPrice: product.price.toString(), CostPrice: product.costPrice?.toString() ?? '',
    }, ...product.variants.map((variant) => ({
      Product: product.nameEn, Brand: product.brand.name, Category: product.category?.nameEn ?? '', Variant: variant.name, SKU: variant.sku,
      PhysicalStock: variant.stock, ReservedStock: variant.reservedStock, AvailableStock: variant.availableStock,
      Status: variant.inventoryStatus, SellingPrice: variant.price.toString(), CostPrice: variant.costPrice?.toString() ?? '',
    }))]);
  } else {
    const analytics = await getBusinessAnalytics(range);
    if (report === 'products') rows = analytics.productPerformance.map((product) => ({
      Product: product.name, Brand: product.brand, Category: product.category, Views: product.views, AddToCart: product.carts,
      WishlistAdds: product.wishlists, DeliveredUnits: product.units, DeliveredRevenue: product.revenue.toFixed(2),
      ConversionPercent: product.conversion.toFixed(2), Rating: product.rating.toFixed(2), Reviews: product.reviews,
      Returns: product.returns, Cancellations: product.cancellations, AvailableStock: product.availableStock, SEOIssues: product.seoMissing,
    }));
    if (report === 'search') rows = analytics.searchPerformance.map((search) => ({ Keyword: search.keyword, Language: search.language, Searches: search.searches, NoResultSearches: search.noResults, ResultClicks: search.clicks }));
    if (report === 'customers') rows = analytics.customers.map((customer) => ({ Customer: customer.name, Phone: customer.phone, City: customer.city, OrdersInPeriod: customer.orders, DeliveredSpendingInPeriod: customer.spending.toFixed(2), LifetimeDeliveredOrders: customer.lifetimeOrders, CustomerLifetimeValue: customer.lifetimeSpending.toFixed(2), FavoriteBrand: customer.favoriteBrand, FavoriteCategory: customer.favoriteCategory, ReturningCustomer: customer.returning ? 'Yes' : 'No' }));
  }

  await prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: `analytics.export.${report}`, affectedType: 'AnalyticsExport', affectedId: `${report}-${Date.now()}`, affectedName: `${report}.${format}`, metadata: { rowCount: rows.length, range: range.key } } });
  return exportResponse(rows, report, format);
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
