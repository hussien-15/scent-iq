import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { apiError } from '@/lib/api-response';
import { productImportTemplateCsv } from '@/services/product-import.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requirePermission('products.create');
    return new NextResponse(productImportTemplateCsv(), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="scentiq-product-import-template.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return apiError(error, { 'Cache-Control': 'private, no-store' });
  }
}
