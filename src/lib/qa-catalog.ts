export const QA_CATEGORIES = [
  { key: 'FUNCTIONALITY', label: 'Storefront functionality', critical: true },
  { key: 'CHECKOUT', label: 'Checkout and orders', critical: true },
  { key: 'ADMIN_DASHBOARD', label: 'Perfume Studio', critical: true },
  { key: 'INVENTORY', label: 'Inventory integrity', critical: true },
  { key: 'SECURITY', label: 'Security and access', critical: true },
  { key: 'SEO', label: 'SEO and indexing', critical: false },
  { key: 'PERFORMANCE', label: 'Performance and Core Web Vitals', critical: false },
  { key: 'MOBILE', label: 'Mobile and browser coverage', critical: false },
  { key: 'RTL', label: 'Arabic, English and RTL', critical: false },
  { key: 'CONTENT_QUALITY', label: 'Content and empty states', critical: false },
  { key: 'DATA_ACCURACY', label: 'Iraqi market and data accuracy', critical: false },
] as const;

export type QaCategoryKey = (typeof QA_CATEGORIES)[number]['key'];

type QaDefinition = {
  key: string;
  category: QaCategoryKey;
  title: string;
  description: string;
  critical?: boolean;
  weight?: number;
};

export const QA_CHECK_DEFINITIONS: readonly QaDefinition[] = [
  {
    key: 'storefront-home',
    category: 'FUNCTIONALITY',
    title: 'Homepage and navigation',
    description: 'Arabic and English homepages, header, footer and primary navigation work without broken links.',
    critical: true,
    weight: 3,
  },
  {
    key: 'storefront-catalog',
    category: 'FUNCTIONALITY',
    title: 'Catalog routes',
    description: 'Product, brand, category, collection, guide and note pages load valid published content.',
    critical: true,
    weight: 3,
  },
  {
    key: 'storefront-search',
    category: 'FUNCTIONALITY',
    title: 'Search, filter and sorting',
    description:
      'Arabic-aware search, suggestions, combined filters, sorting and pagination return consistent results.',
    critical: true,
    weight: 3,
  },
  {
    key: 'storefront-wishlist-cart',
    category: 'FUNCTIONALITY',
    title: 'Wishlist and cart',
    description: 'Wishlist, add to cart, quantities, variants, availability and persistence behave correctly.',
    critical: true,
    weight: 3,
  },
  {
    key: 'storefront-reviews',
    category: 'FUNCTIONALITY',
    title: 'Reviews and trust',
    description: 'Only approved reviews, verified labels, helpful votes, photos and trust content render as designed.',
    weight: 2,
  },

  {
    key: 'checkout-validation',
    category: 'CHECKOUT',
    title: 'Checkout validation',
    description:
      'Required customer, Iraqi phone, address, city and delivery fields are validated on client and server.',
    critical: true,
    weight: 4,
  },
  {
    key: 'checkout-pricing',
    category: 'CHECKOUT',
    title: 'Server-authoritative totals',
    description: 'Product prices, discounts, delivery fees, stock and final totals are recalculated server-side.',
    critical: true,
    weight: 4,
  },
  {
    key: 'checkout-cod-order',
    category: 'CHECKOUT',
    title: 'COD order creation',
    description:
      'A Cash-on-Delivery order can be created once and produces a valid order number and confirmation page.',
    critical: true,
    weight: 4,
  },
  {
    key: 'checkout-order-lifecycle',
    category: 'CHECKOUT',
    title: 'Order lifecycle',
    description:
      'Confirmation, preparation, shipment, delivery, cancellation and return transitions keep history and inventory correct.',
    critical: true,
    weight: 4,
  },

  {
    key: 'studio-auth',
    category: 'ADMIN_DASHBOARD',
    title: 'Studio authentication',
    description: 'Login, logout, session timeout and protected Studio routing work for permitted admins only.',
    critical: true,
    weight: 4,
  },
  {
    key: 'studio-rbac',
    category: 'ADMIN_DASHBOARD',
    title: 'Role-based access control',
    description: 'Each admin role sees and changes only resources allowed by its server-enforced permissions.',
    critical: true,
    weight: 4,
  },
  {
    key: 'studio-catalog',
    category: 'ADMIN_DASHBOARD',
    title: 'Catalog administration',
    description: 'Product, media, collection, review, SEO and import workflows work with clear validation and errors.',
    critical: true,
    weight: 3,
  },
  {
    key: 'studio-operations',
    category: 'ADMIN_DASHBOARD',
    title: 'Operational administration',
    description: 'Orders, delivery, customers, activity, analytics, settings and system-health screens load real data.',
    critical: true,
    weight: 3,
  },

  {
    key: 'inventory-reservation',
    category: 'INVENTORY',
    title: 'Reservation lifecycle',
    description:
      'Checkout reserves available stock and shipping/cancellation/return paths release or deduct it exactly once.',
    critical: true,
    weight: 5,
  },
  {
    key: 'inventory-concurrency',
    category: 'INVENTORY',
    title: 'Overselling protection',
    description: 'Concurrent or duplicate order attempts cannot make available stock negative or oversell a variant.',
    critical: true,
    weight: 5,
  },
  {
    key: 'inventory-movements',
    category: 'INVENTORY',
    title: 'Movement audit trail',
    description:
      'Every adjustment records before/after stock, reservation, reason, actor, order and variant when applicable.',
    critical: true,
    weight: 4,
  },
  {
    key: 'inventory-public-status',
    category: 'INVENTORY',
    title: 'Public availability',
    description: 'Hidden, discontinued and unavailable inventory cannot be purchased or leak into public discovery.',
    critical: true,
    weight: 4,
  },

  {
    key: 'security-auth-secrets',
    category: 'SECURITY',
    title: 'Authentication and secrets',
    description:
      'Secrets stay server-only, passwords are hashed, sessions invalidate safely and hosted cookies use secure settings.',
    critical: true,
    weight: 5,
  },
  {
    key: 'security-inputs',
    category: 'SECURITY',
    title: 'Input and upload protection',
    description:
      'Server actions, APIs, imports, media and webhook inputs enforce validation, size and authorization limits.',
    critical: true,
    weight: 4,
  },
  {
    key: 'security-revalidation-webhooks',
    category: 'SECURITY',
    title: 'Revalidation and webhooks',
    description:
      'Revalidation rejects unauthorized paths and webhooks verify signatures, replay windows and payload limits.',
    critical: true,
    weight: 4,
  },
  {
    key: 'security-db-boundaries',
    category: 'SECURITY',
    title: 'Database boundaries',
    description:
      'Public queries exclude private data, migrations are additive/reviewed and production seed cannot create fake trust data.',
    critical: true,
    weight: 5,
  },

  {
    key: 'seo-metadata',
    category: 'SEO',
    title: 'Metadata and canonicals',
    description:
      'Titles, descriptions, canonicals, Open Graph, hreflang and structured data are accurate on indexable routes.',
    weight: 3,
  },
  {
    key: 'seo-robots-sitemap',
    category: 'SEO',
    title: 'Robots and sitemap',
    description:
      'Setup, Preview and maintenance remain non-indexable; Live robots and sitemap expose only valid public URLs.',
    weight: 3,
  },
  {
    key: 'seo-statuses',
    category: 'SEO',
    title: 'Redirects and HTTP status',
    description:
      '404, canonical redirects, legacy paths and unavailable content return the intended status and destination.',
    weight: 2,
  },

  {
    key: 'performance-budgets',
    category: 'PERFORMANCE',
    title: 'Bundle budgets',
    description:
      'Production route bundles pass the automated performance budget without hidden oversized client islands.',
    weight: 3,
  },
  {
    key: 'performance-cwv',
    category: 'PERFORMANCE',
    title: 'Core Web Vitals',
    description: 'Staging p75 LCP, INP and CLS are measured on representative mobile and desktop routes before launch.',
    weight: 3,
  },
  {
    key: 'performance-images-cache',
    category: 'PERFORMANCE',
    title: 'Images, loading and cache',
    description:
      'Responsive media, reserved dimensions, lazy loading, loading states, ISR and revalidation remain fast and correct.',
    weight: 2,
  },

  {
    key: 'mobile-small',
    category: 'MOBILE',
    title: 'Small mobile',
    description:
      'Storefront, reviews, cart, checkout and Studio are usable at 320–390 px with touch-friendly controls.',
    weight: 3,
  },
  {
    key: 'mobile-tablet-desktop',
    category: 'MOBILE',
    title: 'Tablet and desktop',
    description: 'Layouts remain readable and functional at common tablet and desktop widths without overflow.',
    weight: 2,
  },
  {
    key: 'mobile-browsers',
    category: 'MOBILE',
    title: 'Browser coverage',
    description: 'Current Chrome, Safari, Firefox and Edge complete critical browsing and checkout paths.',
    weight: 3,
  },

  {
    key: 'rtl-arabic',
    category: 'RTL',
    title: 'Arabic and RTL',
    description: 'Arabic copy, direction, mixed numbers, forms, icons, prices and truncation render naturally.',
    weight: 3,
  },
  {
    key: 'rtl-english',
    category: 'RTL',
    title: 'English and LTR',
    description: 'English routes, metadata, controls and content remain complete and correctly aligned.',
    weight: 2,
  },

  {
    key: 'content-real',
    category: 'CONTENT_QUALITY',
    title: 'Real launch content',
    description: 'No demo claims, placeholder email, unfinished policy copy or fake social proof appears publicly.',
    weight: 3,
  },
  {
    key: 'content-errors-empty',
    category: 'CONTENT_QUALITY',
    title: 'Errors and empty states',
    description: '404, error boundaries, empty catalog/cart/review states and retry messages are clear and branded.',
    weight: 2,
  },
  {
    key: 'content-accessibility',
    category: 'CONTENT_QUALITY',
    title: 'Accessibility',
    description:
      'Keyboard order, labels, landmarks, focus, contrast, reduced motion and image alternatives are reviewed.',
    weight: 3,
  },

  {
    key: 'data-products',
    category: 'DATA_ACCURACY',
    title: 'Product data accuracy',
    description:
      'Names, prices, sizes, SKUs, notes, images, stock, ratings and bilingual descriptions match approved sources.',
    weight: 3,
  },
  {
    key: 'data-iraq-delivery',
    category: 'DATA_ACCURACY',
    title: 'Iraq delivery data',
    description:
      'Governorates, addresses, phone formats, COD wording, delivery companies, fees and support channels are verified.',
    weight: 3,
  },
  {
    key: 'data-production-boundary',
    category: 'DATA_ACCURACY',
    title: 'Production data boundary',
    description:
      'Development fixtures are absent from production and analytics/social proof use only real recorded events.',
    weight: 3,
  },
];

export const LAUNCH_APPROVAL_AREAS = [
  { key: 'BUSINESS_OWNER', label: 'Business owner' },
  { key: 'DEVELOPER', label: 'Developer' },
  { key: 'QA', label: 'Quality assurance' },
  { key: 'SEO', label: 'SEO' },
  { key: 'SECURITY', label: 'Security' },
  { key: 'CONTENT', label: 'Content' },
  { key: 'INVENTORY', label: 'Inventory' },
  { key: 'DELIVERY', label: 'Delivery operations' },
] as const;
