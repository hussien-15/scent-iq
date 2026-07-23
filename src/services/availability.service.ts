import { findPublishedAvailability } from '@/repositories/product.repository';
import { availableStock } from '@/services/inventory.service';

export async function getProductAvailability(ids: string[]) {
  const products = await findPublishedAvailability(ids);
  return products.map((product) => ({
    id: product.id,
    available: availableStock(product.stock, product.reservedStock),
    availability: product.availability,
    hasVariants: product.variants.length > 0,
    anyVariantAvailable: product.variants.some((variant) =>
      availableStock(variant.stock, variant.reservedStock) > 0 &&
      !['OUT_OF_STOCK', 'DISCONTINUED'].includes(variant.availability)
    ),
  }));
}
