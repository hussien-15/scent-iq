import { prisma } from '@/lib/prisma';

export type AnalyticsRangeKey = 'today' | 'yesterday' | '7d' | '30d' | 'this-month' | 'last-month' | 'custom';

export type AnalyticsRange = {
  key: AnalyticsRangeKey;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  label: string;
  from: string;
  to: string;
};

export type BusinessInsight = {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  explanation: string;
  action: string;
  href: string;
  affected: string;
};

const DAY = 86_400_000;
const REVENUE_STATUSES = ['DELIVERED'] as const;

function iraqDayStart(date = new Date()) {
  const shifted = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 3 * 60 * 60 * 1000);
}

function dateInput(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

function parseIraqDate(value: string | undefined, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const parsed = new Date(`${value}T00:00:00+03:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function resolveAnalyticsRange(input: { range?: string; from?: string; to?: string }): AnalyticsRange {
  const allowed: AnalyticsRangeKey[] = ['today', 'yesterday', '7d', '30d', 'this-month', 'last-month', 'custom'];
  const key = allowed.includes(input.range as AnalyticsRangeKey) ? input.range as AnalyticsRangeKey : '30d';
  const today = iraqDayStart();
  let start = new Date(today.getTime() - 29 * DAY);
  let end = new Date(today.getTime() + DAY);
  let label = 'Last 30 days';

  if (key === 'today') { start = today; label = 'Today'; }
  if (key === 'yesterday') { start = new Date(today.getTime() - DAY); end = today; label = 'Yesterday'; }
  if (key === '7d') { start = new Date(today.getTime() - 6 * DAY); label = 'Last 7 days'; }
  if (key === 'this-month') {
    const shifted = new Date(today.getTime() + 3 * 60 * 60 * 1000);
    start = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - 3 * 60 * 60 * 1000);
    label = 'This month';
  }
  if (key === 'last-month') {
    const shifted = new Date(today.getTime() + 3 * 60 * 60 * 1000);
    end = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - 3 * 60 * 60 * 1000);
    start = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() - 1, 1) - 3 * 60 * 60 * 1000);
    label = 'Last month';
  }
  if (key === 'custom') {
    start = parseIraqDate(input.from, new Date(today.getTime() - 29 * DAY));
    const requestedEnd = parseIraqDate(input.to, today);
    end = new Date(requestedEnd.getTime() + DAY);
    if (end <= start) end = new Date(start.getTime() + DAY);
    if (end.getTime() - start.getTime() > 366 * DAY) start = new Date(end.getTime() - 366 * DAY);
    label = `${dateInput(start)} to ${dateInput(new Date(end.getTime() - 1))}`;
  }

  const duration = end.getTime() - start.getTime();
  return {
    key, start, end,
    previousStart: new Date(start.getTime() - duration),
    previousEnd: start,
    label,
    from: dateInput(start),
    to: dateInput(new Date(end.getTime() - 1)),
  };
}

function percent(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

function change(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function dayKey(date: Date) {
  return dateInput(date);
}

function jsonString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').replace(/^964/, '0');
}

function languageOf(text: string) {
  return /[\u0600-\u06ff]/.test(text) ? 'Arabic' : 'English';
}

function topTerms(comments: string[], terms: string[]) {
  return terms
    .map((term) => ({ label: term, value: comments.filter((comment) => comment.toLowerCase().includes(term)).length }))
    .filter((term) => term.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export async function getBusinessAnalytics(range: AnalyticsRange) {
  const rangeWhere = { gte: range.start, lt: range.end };
  const previousWhere = { gte: range.previousStart, lt: range.previousEnd };
  // CollectionDailyAnalytics stores a date-only UTC value, while storefront
  // event ranges use Baghdad day boundaries.
  const collectionDateWhere = {
    gte: new Date(`${range.from}T00:00:00Z`),
    lt: new Date(new Date(`${range.to}T00:00:00Z`).getTime() + DAY),
  };

  const [
    orders, previousRevenue, products, searches, collectionRows, events,
    periodReviews, inventoryMovements, lifetimeCustomers,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: rangeWhere },
      take: 10_000,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, createdAt: true, status: true, total: true, subtotal: true,
        city: true, area: true, phone: true, customerName: true,
        deliveryCompany: { select: { id: true, name: true } },
        statusHistory: { where: { newStatus: 'DELIVERED' }, take: 1, orderBy: { createdAt: 'asc' }, select: { createdAt: true } },
        items: {
          select: {
            quantity: true, subtotal: true, perfumeId: true,
            perfume: {
              select: {
                id: true, nameEn: true, slug: true,
                brand: { select: { id: true, name: true } },
                category: { select: { id: true, nameEn: true } },
              },
            },
          },
        },
      },
    }),
    prisma.order.aggregate({
      where: { createdAt: previousWhere, status: { in: [...REVENUE_STATUSES] } },
      _sum: { total: true }, _count: { id: true },
    }),
    prisma.perfume.findMany({
      take: 10_000,
      select: {
        id: true, nameEn: true, slug: true, status: true, price: true, costPrice: true,
        stock: true, reservedStock: true, availableStock: true, lowStockThreshold: true,
        inventoryStatus: true, viewCount: true, purchaseCount: true, wishlistCount: true,
        metaTitleEn: true, metaTitleAr: true, metaDescriptionEn: true, metaDescriptionAr: true,
        descriptionEn: true, descriptionAr: true, keywords: true, ogImage: true,
        scentFamilies: true, season: true, occasion: true,
        notes: { select: { note: { select: { nameEn: true, nameAr: true } } } },
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, nameEn: true } },
        media: { select: { id: true }, take: 1 },
        reviews: {
          where: { approvalStatus: 'APPROVED' },
          select: { rating: true, helpfulYes: true, comment: true, createdAt: true },
        },
        variants: { select: { availableStock: true, stock: true, reservedStock: true, price: true, costPrice: true } },
      },
    }),
    prisma.searchLog.findMany({
      where: { createdAt: rangeWhere },
      take: 30_000,
      select: {
        keyword: true, normalizedKeyword: true, resultsCount: true,
        clickedPerfumeId: true, clickedBrandId: true, createdAt: true,
      },
    }),
    prisma.collectionDailyAnalytics.findMany({
      where: { date: collectionDateWhere },
      take: 10_000,
      include: { collection: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: rangeWhere },
      take: 30_000,
      orderBy: { createdAt: 'asc' },
      select: {
        eventType: true, sessionId: true, perfumeId: true, brandId: true, collectionId: true,
        pathname: true, source: true, sourceDetail: true, device: true, value: true,
        metadata: true, createdAt: true,
        order: { select: { status: true, total: true } },
      },
    }),
    prisma.review.findMany({
      where: { createdAt: rangeWhere }, take: 10_000,
      select: {
        id: true, rating: true, approvalStatus: true, helpfulYes: true, comment: true,
        perfumeId: true, createdAt: true, perfume: { select: { nameEn: true, slug: true } },
      },
    }),
    prisma.inventoryMovement.findMany({
      where: { createdAt: rangeWhere }, take: 20_000,
      select: { perfumeId: true, movementType: true, quantityChanged: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ['phone'], where: { status: 'DELIVERED' },
      _sum: { total: true }, _count: { id: true },
    }),
  ]);

  const deliveredOrders = orders.filter((order) => order.status === 'DELIVERED');
  const activeOrders = orders.filter((order) => ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(order.status));
  const deliveredRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const activeOrderValue = activeOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const previousDeliveredRevenue = Number(previousRevenue._sum.total ?? 0);
  const averageOrderValue = deliveredOrders.length ? deliveredRevenue / deliveredOrders.length : 0;

  const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
  const orderStatuses = statusOrder.map((label) => ({
    label,
    value: orders.filter((order) => order.status === label).length,
  }));
  const hourMap = new Map<string, number>();
  const weekdayMap = new Map<string, number>();
  for (const order of orders) {
    const hour = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Baghdad', hour: 'numeric' }).format(order.createdAt);
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Baghdad', weekday: 'long' }).format(order.createdAt);
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1); weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + 1);
  }
  const peakHour = [...hourMap].sort((a, b) => b[1] - a[1])[0];
  const topOrderDay = [...weekdayMap].sort((a, b) => b[1] - a[1])[0];

  const dayMap = new Map<string, { label: string; revenue: number; orders: number; delivered: number }>();
  for (let cursor = new Date(range.start); cursor < range.end; cursor = new Date(cursor.getTime() + DAY)) {
    const key = dayKey(cursor);
    dayMap.set(key, { label: key.slice(5), revenue: 0, orders: 0, delivered: 0 });
  }
  for (const order of orders) {
    const row = dayMap.get(dayKey(order.createdAt));
    if (!row) continue;
    row.orders += 1;
    if (order.status === 'DELIVERED') { row.delivered += 1; row.revenue += Number(order.total); }
  }
  const revenueTrend = [...dayMap.values()];

  const eventCounts = new Map<string, number>();
  for (const event of events) eventCounts.set(event.eventType, (eventCounts.get(event.eventType) ?? 0) + 1);
  const sessionEvents = new Map<string, typeof events>();
  for (const event of events) {
    if (!event.sessionId) continue;
    const list = sessionEvents.get(event.sessionId) ?? [];
    list.push(event);
    sessionEvents.set(event.sessionId, list);
  }
  const sessions = [...sessionEvents.entries()];
  const sessionsWith = (eventType: string) => sessions.filter(([, list]) => list.some((event) => event.eventType === eventType));
  const homepageSessions = sessions.filter(([, list]) => list.some((event) => event.eventType === 'PAGE_VIEW' && /^\/(ar|en)\/?$/.test(event.pathname ?? '')));
  const pageViewSessions = sessionsWith('PAGE_VIEW');
  const productViewSessions = sessionsWith('PRODUCT_VIEW');
  const cartSessions = sessionsWith('ADD_TO_CART');
  const checkoutSessions = sessionsWith('CHECKOUT_STARTED');
  const placedSessions = sessionsWith('ORDER_PLACED');
  const confirmedSessions = sessionsWith('ORDER_CONFIRMED');
  const deliveredSessions = sessionsWith('ORDER_DELIVERED');
  const funnel = [
    { label: 'Homepage visits', value: homepageSessions.length },
    { label: 'Product views', value: productViewSessions.length },
    { label: 'Add to cart', value: cartSessions.length },
    { label: 'Checkout started', value: checkoutSessions.length },
    { label: 'Order placed', value: placedSessions.length },
    { label: 'Order confirmed', value: confirmedSessions.length },
    { label: 'Order delivered', value: deliveredSessions.length },
  ].map((stage, index, rows) => ({
    ...stage,
    dropoff: index === 0 ? 0 : Math.max(0, percent(rows[index - 1].value - stage.value, rows[index - 1].value)),
  }));
  const conversionRate = percent(placedSessions.length, pageViewSessions.length);

  const abandonedSessionIds = new Set(cartSessions.filter(([, list]) => !list.some((event) => event.eventType === 'ORDER_PLACED')).map(([id]) => id));
  const abandonedCartEvents = events.filter((event) => event.sessionId && abandonedSessionIds.has(event.sessionId) && event.eventType === 'ADD_TO_CART');
  const abandonedProductsMap = new Map<string, number>();
  for (const event of abandonedCartEvents) if (event.perfumeId) abandonedProductsMap.set(event.perfumeId, (abandonedProductsMap.get(event.perfumeId) ?? 0) + 1);
  const averageCartValue = cartSessions.length
    ? cartSessions.reduce((sum, [, list]) => sum + list.filter((event) => event.eventType === 'ADD_TO_CART').reduce((total, event) => total + Number(event.value ?? 0), 0), 0) / cartSessions.length
    : 0;

  const productEventMap = new Map<string, { views: number; carts: number; wishlists: number; recommendationClicks: number }>();
  for (const event of events) {
    if (!event.perfumeId) continue;
    const stats = productEventMap.get(event.perfumeId) ?? { views: 0, carts: 0, wishlists: 0, recommendationClicks: 0 };
    if (event.eventType === 'PRODUCT_VIEW') stats.views += 1;
    if (event.eventType === 'ADD_TO_CART') stats.carts += 1;
    if (event.eventType === 'WISHLIST_ADDED') stats.wishlists += 1;
    if (event.eventType === 'RECOMMENDATION_CLICK') stats.recommendationClicks += 1;
    productEventMap.set(event.perfumeId, stats);
  }
  const deliveredItems = deliveredOrders.flatMap((order) => order.items);
  const placedItems = orders.filter((order) => !['CANCELLED', 'RETURNED'].includes(order.status)).flatMap((order) => order.items);
  const salesMap = new Map<string, { units: number; revenue: number }>();
  for (const item of deliveredItems) {
    const stats = salesMap.get(item.perfumeId) ?? { units: 0, revenue: 0 };
    stats.units += item.quantity; stats.revenue += Number(item.subtotal); salesMap.set(item.perfumeId, stats);
  }
  const returnMap = new Map<string, number>();
  const cancellationMap = new Map<string, number>();
  for (const order of orders) for (const item of order.items) {
    if (order.status === 'RETURNED') returnMap.set(item.perfumeId, (returnMap.get(item.perfumeId) ?? 0) + item.quantity);
    if (order.status === 'CANCELLED') cancellationMap.set(item.perfumeId, (cancellationMap.get(item.perfumeId) ?? 0) + item.quantity);
  }
  const productLookup = new Map(products.map((product) => [product.id, product]));
  const productPerformance = products.map((product) => {
    const event = productEventMap.get(product.id) ?? { views: 0, carts: 0, wishlists: 0, recommendationClicks: 0 };
    const sales = salesMap.get(product.id) ?? { units: 0, revenue: 0 };
    const rating = product.reviews.length ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 0;
    const seoMissing = [product.metaTitleEn, product.metaTitleAr, product.metaDescriptionEn, product.metaDescriptionAr, product.ogImage]
      .filter((value) => !value).length + (product.media.length ? 0 : 1) + (product.keywords.length ? 0 : 1);
    return {
      id: product.id, name: product.nameEn, slug: product.slug, brand: product.brand.name,
      category: product.category?.nameEn ?? 'Uncategorized', views: event.views,
      carts: event.carts, wishlists: event.wishlists, lifetimeWishlists: product.wishlistCount,
      units: sales.units, revenue: sales.revenue, conversion: percent(sales.units, event.views),
      rating, reviews: product.reviews.length, returns: returnMap.get(product.id) ?? 0,
      cancellations: cancellationMap.get(product.id) ?? 0, availableStock: product.availableStock,
      inventoryStatus: product.inventoryStatus, seoMissing, recommendationClicks: event.recommendationClicks,
    };
  }).sort((a, b) => b.revenue - a.revenue || b.units - a.units || b.views - a.views);

  const brandMap = new Map<string, { id: string; name: string; views: number; carts: number; units: number; revenue: number; ratingTotal: number; reviews: number; products: number }>();
  for (const product of productPerformance) {
    const raw = productLookup.get(product.id)!;
    const row = brandMap.get(raw.brand.id) ?? { id: raw.brand.id, name: raw.brand.name, views: 0, carts: 0, units: 0, revenue: 0, ratingTotal: 0, reviews: 0, products: 0 };
    row.views += product.views; row.carts += product.carts; row.units += product.units; row.revenue += product.revenue;
    row.ratingTotal += product.rating * product.reviews; row.reviews += product.reviews; row.products += 1;
    brandMap.set(raw.brand.id, row);
  }
  const brandPerformance = [...brandMap.values()].map((row) => ({
    ...row, conversion: percent(row.units, row.views), rating: row.reviews ? row.ratingTotal / row.reviews : 0,
  })).sort((a, b) => b.revenue - a.revenue || b.views - a.views);
  const categoryPerformance = [...productPerformance.reduce((map, product) => {
    const row = map.get(product.category) ?? { name: product.category, views: 0, units: 0, revenue: 0 };
    row.views += product.views; row.units += product.units; row.revenue += product.revenue; map.set(product.category, row); return map;
  }, new Map<string, { name: string; views: number; units: number; revenue: number }>()).values()].sort((a, b) => b.revenue - a.revenue || b.views - a.views);

  const collectionMap = new Map<string, { id: string; name: string; slug: string; views: number; clicks: number; carts: number; purchases: number; revenue: number }>();
  for (const row of collectionRows) {
    const current = collectionMap.get(row.collectionId) ?? { id: row.collectionId, name: row.collection.name, slug: row.collection.slug, views: 0, clicks: 0, carts: 0, purchases: 0, revenue: 0 };
    current.views += row.views; current.clicks += row.productClicks; current.carts += row.addToCarts;
    current.purchases += row.purchases; current.revenue += Number(row.revenue); collectionMap.set(row.collectionId, current);
  }
  const collectionPerformance = [...collectionMap.values()].map((row) => ({ ...row, conversion: percent(row.purchases, row.views) })).sort((a, b) => b.revenue - a.revenue || b.views - a.views);

  const searchMap = new Map<string, { keyword: string; searches: number; noResults: number; clicks: number; language: string }>();
  for (const search of searches) {
    const key = search.normalizedKeyword || search.keyword.toLowerCase();
    const row = searchMap.get(key) ?? { keyword: search.keyword, searches: 0, noResults: 0, clicks: 0, language: languageOf(search.keyword) };
    row.searches += 1; if (search.resultsCount === 0) row.noResults += 1;
    if (search.clickedPerfumeId || search.clickedBrandId) row.clicks += 1;
    searchMap.set(key, row);
  }
  const searchPerformance = [...searchMap.values()].sort((a, b) => b.searches - a.searches);
  const searchLanguages = ['Arabic', 'English'].map((label) => ({ label, value: searches.filter((search) => languageOf(search.keyword) === label).length }));
  const countSearchFacets = (labels: string[], clickedIds?: Map<string, string>) => {
    const unique = [...new Set(labels.filter(Boolean))];
    const counts = new Map(unique.map((label) => [label, 0]));
    for (const search of searches) {
      const query = search.keyword.toLowerCase();
      for (const label of unique) if (query.includes(label.toLowerCase())) counts.set(label, (counts.get(label) ?? 0) + 1);
      if (clickedIds && search.clickedBrandId) {
        const clicked = clickedIds.get(search.clickedBrandId);
        if (clicked) counts.set(clicked, (counts.get(clicked) ?? 0) + 1);
      }
    }
    return [...counts].filter(([, value]) => value > 0).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  };
  const brandIds = new Map(products.map((product) => [product.brand.id, product.brand.name]));
  const searchFacets = {
    brands: countSearchFacets(products.map((product) => product.brand.name), brandIds),
    notes: countSearchFacets(products.flatMap((product) => product.notes.flatMap((entry) => [entry.note.nameEn, entry.note.nameAr]))),
    seasons: countSearchFacets(products.flatMap((product) => product.season)),
    occasions: countSearchFacets(products.flatMap((product) => product.occasion)),
  };

  const cityMap = new Map<string, { city: string; orders: number; delivered: number; cancelled: number; returned: number; revenue: number }>();
  const deliveryMap = new Map<string, { name: string; orders: number; delivered: number; cancelled: number; returned: number; deliveryHours: number; timedDeliveries: number }>();
  for (const order of orders) {
    const cityKey = order.city.trim() || 'Unknown';
    const city = cityMap.get(cityKey) ?? { city: cityKey, orders: 0, delivered: 0, cancelled: 0, returned: 0, revenue: 0 };
    city.orders += 1;
    if (order.status === 'DELIVERED') { city.delivered += 1; city.revenue += Number(order.total); }
    if (order.status === 'CANCELLED') city.cancelled += 1;
    if (order.status === 'RETURNED') city.returned += 1;
    cityMap.set(cityKey, city);
    const companyName = order.deliveryCompany?.name ?? 'Unassigned';
    const company = deliveryMap.get(companyName) ?? { name: companyName, orders: 0, delivered: 0, cancelled: 0, returned: 0, deliveryHours: 0, timedDeliveries: 0 };
    company.orders += 1; if (order.status === 'DELIVERED') company.delivered += 1;
    const deliveredAt = order.statusHistory[0]?.createdAt;
    if (deliveredAt) { company.deliveryHours += Math.max(0, (deliveredAt.getTime() - order.createdAt.getTime()) / 3_600_000); company.timedDeliveries += 1; }
    if (order.status === 'CANCELLED') company.cancelled += 1; if (order.status === 'RETURNED') company.returned += 1;
    deliveryMap.set(companyName, company);
  }
  const cityPerformance = [...cityMap.values()].map((row) => ({ ...row, successRate: percent(row.delivered, row.orders) })).sort((a, b) => b.orders - a.orders);
  const deliveryPerformance = [...deliveryMap.values()].map((row) => ({ ...row, successRate: percent(row.delivered, row.orders), issueRate: percent(row.cancelled + row.returned, row.orders), averageDeliveryDays: row.timedDeliveries ? row.deliveryHours / row.timedDeliveries / 24 : 0 })).sort((a, b) => b.orders - a.orders);

  const lifetimeMap = new Map(lifetimeCustomers.map((customer) => [normalizePhone(customer.phone), { orders: customer._count.id, spending: Number(customer._sum.total ?? 0) }]));
  const customerMap = new Map<string, { phone: string; name: string; city: string; orders: number; deliveredOrders: number; spending: number; brands: Map<string, number>; categories: Map<string, number> }>();
  for (const order of orders) {
    const key = normalizePhone(order.phone);
    const customer = customerMap.get(key) ?? { phone: order.phone, name: order.customerName, city: order.city, orders: 0, deliveredOrders: 0, spending: 0, brands: new Map<string, number>(), categories: new Map<string, number>() };
    customer.orders += 1;
    if (order.status === 'DELIVERED') {
      customer.deliveredOrders += 1; customer.spending += Number(order.total);
      for (const item of order.items) {
        customer.brands.set(item.perfume.brand.name, (customer.brands.get(item.perfume.brand.name) ?? 0) + item.quantity);
        const category = item.perfume.category?.nameEn ?? 'Uncategorized';
        customer.categories.set(category, (customer.categories.get(category) ?? 0) + item.quantity);
      }
    }
    customerMap.set(key, customer);
  }
  const customers = [...customerMap.entries()].map(([key, customer]) => {
    const lifetime = lifetimeMap.get(key) ?? { orders: customer.deliveredOrders, spending: customer.spending };
    const favoriteBrand = [...customer.brands].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const favoriteCategory = [...customer.categories].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return { phone: customer.phone, name: customer.name, city: customer.city, orders: customer.orders, spending: customer.spending, lifetimeOrders: lifetime.orders, lifetimeSpending: lifetime.spending, favoriteBrand, favoriteCategory, returning: lifetime.orders > customer.deliveredOrders || customer.orders > 1 };
  }).sort((a, b) => b.lifetimeSpending - a.lifetimeSpending || b.orders - a.orders);
  const returningCustomers = customers.filter((customer) => customer.returning).length;

  const stockSellingValue = products.reduce((sum, product) => sum + product.availableStock * Number(product.price) + product.variants.reduce((variantSum, variant) => variantSum + variant.availableStock * Number(variant.price), 0), 0);
  const stockCostValue = products.reduce((sum, product) => sum + product.availableStock * Number(product.costPrice ?? 0) + product.variants.reduce((variantSum, variant) => variantSum + variant.availableStock * Number(variant.costPrice ?? 0), 0), 0);
  const shippedMap = new Map<string, number>();
  for (const movement of inventoryMovements) if (movement.movementType === 'ORDER_SHIPPED') shippedMap.set(movement.perfumeId, (shippedMap.get(movement.perfumeId) ?? 0) + Math.abs(movement.quantityChanged));
  const fastMoving = productPerformance.filter((product) => shippedMap.has(product.id)).sort((a, b) => (shippedMap.get(b.id) ?? 0) - (shippedMap.get(a.id) ?? 0)).slice(0, 6);
  const slowMoving = productPerformance.filter((product) => product.availableStock > 0 && !shippedMap.has(product.id)).sort((a, b) => b.availableStock - a.availableStock).slice(0, 6);

  const approvedPeriodReviews = periodReviews.filter((review) => review.approvalStatus === 'APPROVED');
  const allApprovedReviews = products.flatMap((product) => product.reviews.map((review) => ({ ...review, perfume: product.nameEn, perfumeId: product.id, slug: product.slug })));
  const reviewAverage = allApprovedReviews.length ? allApprovedReviews.reduce((sum, review) => sum + review.rating, 0) / allApprovedReviews.length : 0;
  const comments = allApprovedReviews.map((review) => review.comment?.toLowerCase()).filter(Boolean) as string[];
  const commonComplaints = topTerms(comments, ['weak', 'projection', 'lasting', 'delivery', 'packaging', 'price', 'ضعيف', 'ثبات', 'توصيل', 'تغليف', 'سعر']);
  const commonPraise = topTerms(comments, ['luxury', 'long lasting', 'beautiful', 'value', 'original', 'فخم', 'ثبات', 'جميل', 'أصلي']);
  const mostHelpfulReviews = allApprovedReviews.sort((a, b) => b.helpfulYes - a.helpfulYes).slice(0, 5);

  const sourceMap = new Map<string, { label: string; sessions: Set<string>; pageViews: number; orders: Set<string>; revenue: number }>();
  const deviceMap = new Map<string, { label: string; sessions: Set<string>; pageViews: number; orders: Set<string> }>();
  for (const event of events) {
    const source = sourceMap.get(event.source) ?? { label: event.source, sessions: new Set<string>(), pageViews: 0, orders: new Set<string>(), revenue: 0 };
    if (event.sessionId) source.sessions.add(event.sessionId);
    if (event.eventType === 'PAGE_VIEW') source.pageViews += 1;
    if (event.eventType === 'ORDER_PLACED' && event.sessionId) source.orders.add(event.sessionId);
    if (event.eventType === 'ORDER_DELIVERED' && event.order?.status === 'DELIVERED') source.revenue += Number(event.order.total);
    sourceMap.set(event.source, source);
    const device = deviceMap.get(event.device) ?? { label: event.device, sessions: new Set<string>(), pageViews: 0, orders: new Set<string>() };
    if (event.sessionId) device.sessions.add(event.sessionId);
    if (event.eventType === 'PAGE_VIEW') device.pageViews += 1;
    if (event.eventType === 'ORDER_PLACED' && event.sessionId) device.orders.add(event.sessionId);
    deviceMap.set(event.device, device);
  }
  const trafficSources = [...sourceMap.values()].map((row) => ({ label: row.label, sessions: row.sessions.size, pageViews: row.pageViews, orders: row.orders.size, revenue: row.revenue, conversion: percent(row.orders.size, row.sessions.size) })).sort((a, b) => b.sessions - a.sessions);
  const devices = [...deviceMap.values()].map((row) => ({ label: row.label, sessions: row.sessions.size, pageViews: row.pageViews, orders: row.orders.size, conversion: percent(row.orders.size, row.sessions.size) })).sort((a, b) => b.sessions - a.sessions);
  const bounceRate = percent(pageViewSessions.filter(([, list]) => list.filter((event) => event.eventType === 'PAGE_VIEW').length <= 1).length, pageViewSessions.length);
  const averageSessionSeconds = sessions.length ? sessions.reduce((sum, [, list]) => sum + Math.max(0, (list.at(-1)!.createdAt.getTime() - list[0].createdAt.getTime()) / 1000), 0) / sessions.length : 0;

  const recommendationImpressions = eventCounts.get('RECOMMENDATION_IMPRESSION') ?? 0;
  const recommendationClicks = eventCounts.get('RECOMMENDATION_CLICK') ?? 0;
  const recommendationSessions = sessionsWith('RECOMMENDATION_CLICK');
  const recommendationOrders = recommendationSessions.filter(([, list]) => list.some((event) => event.eventType === 'ORDER_PLACED')).length;
  const recommendationTypesMap = new Map<string, { label: string; impressions: number; clicks: number }>();
  for (const event of events.filter((entry) => ['RECOMMENDATION_IMPRESSION', 'RECOMMENDATION_CLICK'].includes(entry.eventType))) {
    const label = jsonString(event.metadata, 'recommendationType') ?? 'Unknown block';
    const row = recommendationTypesMap.get(label) ?? { label, impressions: 0, clicks: 0 };
    if (event.eventType === 'RECOMMENDATION_IMPRESSION') row.impressions += 1; else row.clicks += 1;
    recommendationTypesMap.set(label, row);
  }
  const recommendationTypes = [...recommendationTypesMap.values()].map((row) => ({ ...row, clickRate: percent(row.clicks, row.impressions) })).sort((a, b) => b.clicks - a.clicks);

  const eligiblePages = products.filter((product) => product.status === 'PUBLISHED').length;
  const seoGaps = productPerformance.filter((product) => product.seoMissing > 0).sort((a, b) => b.seoMissing - a.seoMissing);
  const organicLandingMap = new Map<string, number>();
  for (const event of events.filter((entry) => entry.eventType === 'PAGE_VIEW' && entry.source === 'GOOGLE' && entry.pathname)) organicLandingMap.set(event.pathname!, (organicLandingMap.get(event.pathname!) ?? 0) + 1);
  const organicLandingPages = [...organicLandingMap].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const insights: BusinessInsight[] = [];
  for (const product of productPerformance) {
    if (product.inventoryStatus === 'OUT_OF_STOCK' && (product.views >= 5 || product.lifetimeWishlists > 0 || product.units > 0)) insights.push({ priority: 'CRITICAL', title: `${product.name} is unavailable while demand exists`, explanation: `${product.views} period views, ${product.lifetimeWishlists} saved wishes, and ${product.units} delivered units were recorded.`, action: 'Restock it or expose in-stock alternatives.', href: `/studio/inventory?q=${encodeURIComponent(product.name)}`, affected: product.name });
    else if (product.inventoryStatus === 'LOW_STOCK' && (product.views >= 5 || product.units > 0)) insights.push({ priority: 'HIGH', title: `${product.name} needs a stock decision`, explanation: `Only ${product.availableStock} units are available while demand signals are active.`, action: 'Review movement history and restock priority.', href: `/studio/inventory?q=${encodeURIComponent(product.name)}`, affected: product.name });
    if (product.views >= 10 && product.units === 0) insights.push({ priority: 'HIGH', title: `${product.name} gets attention but no delivered sales`, explanation: `${product.views} tracked product views produced no delivered units in this period.`, action: 'Review price, imagery, delivery clarity, and product copy.', href: `/studio/products?q=${encodeURIComponent(product.name)}`, affected: product.name });
    if (product.views >= 10 && product.reviews === 0) insights.push({ priority: 'MEDIUM', title: `${product.name} needs customer proof`, explanation: `${product.views} views were recorded but there are no approved reviews.`, action: 'Request reviews from delivered-order customers.', href: `/studio/reviews?product=${product.id}`, affected: product.name });
    if (product.seoMissing >= 4) insights.push({ priority: 'LOW', title: `${product.name} has incomplete SEO content`, explanation: `${product.seoMissing} important bilingual SEO or media signals are missing.`, action: 'Complete metadata, keywords, and imagery.', href: '/studio/seo', affected: product.name });
  }
  for (const search of searchPerformance.filter((row) => row.noResults >= 2).slice(0, 4)) insights.push({ priority: search.noResults >= 5 ? 'CRITICAL' : 'HIGH', title: `Customers cannot find “${search.keyword}”`, explanation: `${search.noResults} searches returned no results in ${range.label.toLowerCase()}.`, action: 'Add the requested product, alias, or a relevant alternative.', href: `/studio/products?q=${encodeURIComponent(search.keyword)}`, affected: search.keyword });
  for (const collection of collectionPerformance.filter((row) => row.views >= 10 && row.purchases === 0).slice(0, 3)) insights.push({ priority: 'MEDIUM', title: `${collection.name} engages without orders`, explanation: `${collection.views} views and ${collection.clicks} product clicks produced no attributed order.`, action: 'Improve product mix, editorial guidance, or homepage placement.', href: `/studio/collections/${collection.id}`, affected: collection.name });
  for (const company of deliveryPerformance.filter((row) => row.orders >= 5 && row.issueRate >= 30).slice(0, 2)) insights.push({ priority: 'HIGH', title: `${company.name} has a high issue rate`, explanation: `${company.issueRate.toFixed(1)}% of period orders were cancelled or returned.`, action: 'Review delivery follow-up and partner performance.', href: '/studio/delivery', affected: company.name });
  const priorityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  insights.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  return {
    range,
    summary: {
      deliveredRevenue, activeOrderValue, orders: orders.length, deliveredOrders: deliveredOrders.length,
      averageOrderValue, conversionRate, visitors: pageViewSessions.length,
      products: products.length, lowStock: products.filter((product) => product.inventoryStatus === 'LOW_STOCK').length,
      outOfStock: products.filter((product) => product.inventoryStatus === 'OUT_OF_STOCK').length,
      revenueChange: change(deliveredRevenue, previousDeliveredRevenue),
      previousDeliveredRevenue, searchCount: searches.length,
    },
    revenueTrend, orderStatuses, funnel, orderTiming: { peakHour: peakHour?.[0] ?? 'No data', peakHourOrders: peakHour?.[1] ?? 0, topDay: topOrderDay?.[0] ?? 'No data', topDayOrders: topOrderDay?.[1] ?? 0 },
    productPerformance: productPerformance.slice(0, 50), brandPerformance, categoryPerformance,
    collectionPerformance, searchPerformance: searchPerformance.slice(0, 50), searchLanguages, searchFacets,
    cityPerformance, deliveryPerformance,
    customers: customers.slice(0, 50), customerSummary: {
      total: customers.length, returning: returningCustomers, new: customers.length - returningCustomers,
      averageSpending: customers.length ? customers.reduce((sum, customer) => sum + customer.spending, 0) / customers.length : 0,
      averageLifetimeValue: customers.length ? customers.reduce((sum, customer) => sum + customer.lifetimeSpending, 0) / customers.length : 0,
      ordersPerCustomer: customers.length ? orders.length / customers.length : 0,
    },
    inventory: {
      stockSellingValue, stockCostValue, lowStock: products.filter((product) => product.inventoryStatus === 'LOW_STOCK').length,
      outOfStock: products.filter((product) => product.inventoryStatus === 'OUT_OF_STOCK').length,
      fastMoving, slowMoving,
    },
    reviews: {
      average: reviewAverage, total: allApprovedReviews.length, growth: approvedPeriodReviews.length,
      productsWithoutReviews: productPerformance.filter((product) => product.reviews === 0).length,
      commonComplaints, commonPraise, mostHelpful: mostHelpfulReviews,
    },
    cart: {
      abandonmentRate: percent(abandonedSessionIds.size, cartSessions.length),
      abandonedCarts: abandonedSessionIds.size, averageCartValue,
      abandonedProducts: [...abandonedProductsMap].map(([id, value]) => ({ label: productLookup.get(id)?.nameEn ?? 'Unknown product', value })).sort((a, b) => b.value - a.value).slice(0, 8),
    },
    traffic: { sources: trafficSources, devices, bounceRate, averageSessionSeconds },
    recommendations: { impressions: recommendationImpressions, clicks: recommendationClicks, clickRate: percent(recommendationClicks, recommendationImpressions), conversionRate: percent(recommendationOrders, recommendationSessions.length), attributedOrderSessions: recommendationOrders, types: recommendationTypes },
    seo: { eligiblePages, gaps: seoGaps.slice(0, 20), organicLandingPages },
    insights: insights.slice(0, 16),
    dataLimits: { ordersCapped: orders.length === 10_000, eventsCapped: events.length === 30_000, searchesCapped: searches.length === 30_000 },
    placedItems: placedItems.length,
  };
}
