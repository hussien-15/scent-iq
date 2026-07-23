import { revalidatePath } from 'next/cache';
import { ValidationError } from '@/lib/errors';

export type RevalidationTarget =
  | { entity: 'home' }
  | { entity: 'shop' }
  | { entity: 'product'; slug: string }
  | { entity: 'brand'; slug: string }
  | { entity: 'collection'; slug: string }
  | { entity: 'order'; id: string };

const safeSlug = /^[a-z0-9\u0600-\u06ff]+(?:-[a-z0-9\u0600-\u06ff]+)*$/i;
const safeId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function revalidateTarget(target: RevalidationTarget) {
  if ('slug' in target && !safeSlug.test(target.slug)) throw new ValidationError('Invalid revalidation slug.');
  if ('id' in target && !safeId.test(target.id)) throw new ValidationError('Invalid revalidation identifier.');

  const paths: string[] = [];
  if (target.entity === 'home') paths.push('/ar', '/en');
  if (target.entity === 'shop') paths.push('/ar/shop', '/en/shop');
  if (target.entity === 'product') paths.push(`/ar/product/${target.slug}`, `/en/product/${target.slug}`, '/ar/shop', '/en/shop', '/studio/products', '/studio', '/sitemap.xml');
  if (target.entity === 'brand') paths.push(`/ar/brands/${target.slug}`, `/en/brands/${target.slug}`, '/ar/brands', '/en/brands');
  if (target.entity === 'collection') paths.push(`/ar/collections/${target.slug}`, `/en/collections/${target.slug}`, '/ar/collections', '/en/collections');
  if (target.entity === 'order') paths.push(`/studio/orders/${target.id}`, '/studio/orders', '/studio', '/studio/analytics', '/studio/inventory');
  for (const path of paths) revalidatePath(path);
  return paths;
}

export function revalidateOrder(orderId: string, productSlugs: string[]) {
  const paths = revalidateTarget({ entity: 'order', id: orderId });
  for (const slug of new Set(productSlugs)) paths.push(...revalidateTarget({ entity: 'product', slug }));
  return [...new Set(paths)];
}
