export const ADMIN_PERMISSIONS = [
  'dashboard.view',
  'products.view', 'products.create', 'products.edit', 'products.delete', 'products.publish',
  'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
  'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
  'taxonomy.view', 'taxonomy.create', 'taxonomy.edit', 'taxonomy.delete',
  'collections.view', 'collections.create', 'collections.edit', 'collections.delete',
  'orders.view', 'orders.update_status', 'orders.cancel', 'orders.export',
  'inventory.view', 'inventory.adjust', 'inventory.import', 'inventory.export',
  'customers.view', 'customers.edit',
  'reviews.view', 'reviews.approve', 'reviews.reject', 'reviews.delete', 'reviews.manage',
  'analytics.view', 'analytics.export',
  'seo.view', 'seo.edit',
  'media.view', 'media.upload', 'media.delete',
  'recommendations.view', 'recommendations.edit', 'recommendations.manage',
  'delivery.view', 'delivery.edit',
  'settings.view', 'settings.edit',
  'qa.view', 'qa.manage', 'qa.approve',
  'activity.view', 'activity_logs.view',
  'admin_users.manage',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
export type AdminRoleName =
  | 'SUPER_ADMIN' | 'MANAGER' | 'CONTENT_EDITOR' | 'ORDER_MANAGER'
  | 'INVENTORY_MANAGER' | 'CUSTOMER_SUPPORT' | 'SEO_EDITOR' | 'VIEWER';

const viewPermissions: AdminPermission[] = [
  'dashboard.view', 'products.view', 'brands.view', 'categories.view', 'taxonomy.view', 'collections.view',
  'orders.view', 'inventory.view', 'reviews.view', 'analytics.view', 'seo.view',
  'media.view', 'recommendations.view', 'delivery.view', 'settings.view', 'activity.view',
  'qa.view',
];

export const ROLE_PERMISSIONS: Record<AdminRoleName, readonly AdminPermission[]> = {
  SUPER_ADMIN: ADMIN_PERMISSIONS,
  MANAGER: ADMIN_PERMISSIONS.filter((permission) => ![
    'admin_users.manage', 'settings.edit', 'media.delete', 'products.delete', 'brands.delete',
  ].includes(permission)),
  CONTENT_EDITOR: [
    'dashboard.view', 'products.view', 'products.create', 'products.edit', 'products.publish',
    'brands.view', 'brands.create', 'brands.edit', 'categories.view', 'categories.edit',
    'taxonomy.view', 'taxonomy.create', 'taxonomy.edit',
    'collections.view', 'collections.create', 'collections.edit', 'media.view', 'media.upload',
    'seo.view', 'seo.edit', 'recommendations.view', 'recommendations.edit',
  ],
  ORDER_MANAGER: ['dashboard.view', 'orders.view', 'orders.update_status', 'orders.cancel', 'orders.export', 'customers.view', 'customers.edit', 'delivery.view', 'analytics.view', 'analytics.export'],
  INVENTORY_MANAGER: ['dashboard.view', 'products.view', 'inventory.view', 'inventory.adjust', 'inventory.import', 'inventory.export', 'analytics.view'],
  CUSTOMER_SUPPORT: ['dashboard.view', 'orders.view', 'orders.update_status', 'customers.view', 'customers.edit', 'reviews.view', 'reviews.manage'],
  SEO_EDITOR: ['dashboard.view', 'products.view', 'brands.view', 'categories.view', 'taxonomy.view', 'taxonomy.edit', 'collections.view', 'seo.view', 'seo.edit', 'media.view', 'media.upload', 'analytics.view'],
  VIEWER: viewPermissions,
};

export const ADMIN_ROLE_LABELS: Record<AdminRoleName, string> = {
  SUPER_ADMIN: 'Super Admin', MANAGER: 'Manager', CONTENT_EDITOR: 'Content Editor',
  ORDER_MANAGER: 'Order Manager', INVENTORY_MANAGER: 'Inventory Manager',
  CUSTOMER_SUPPORT: 'Customer Support', SEO_EDITOR: 'SEO Editor', VIEWER: 'Viewer',
};

export function normalizeAdminRole(role?: string | null): AdminRoleName {
  return role && role in ROLE_PERMISSIONS ? role as AdminRoleName : 'SUPER_ADMIN';
}

export function roleHasPermission(role: string | null | undefined, permission: AdminPermission) {
  return ROLE_PERMISSIONS[normalizeAdminRole(role)].includes(permission);
}

const STUDIO_ROUTE_PERMISSIONS: Array<[string, AdminPermission]> = [
  ['/studio/qa', 'qa.view'],
  ['/studio/system-health', 'admin_users.manage'],
  ['/studio/setup', 'settings.view'],
  ['/studio/admins', 'admin_users.manage'], ['/studio/activity', 'activity.view'],
  ['/studio/performance', 'analytics.view'],
  ['/studio/analytics', 'analytics.view'], ['/studio/inventory', 'inventory.view'],
  ['/studio/orders', 'orders.view'], ['/studio/customers', 'customers.view'],
  ['/studio/reviews', 'reviews.view'], ['/studio/seo', 'seo.view'],
  ['/studio/media', 'media.view'], ['/studio/recommendations', 'recommendations.view'],
  ['/studio/settings', 'settings.view'], ['/studio/delivery', 'delivery.view'],
  ['/studio/taxonomy', 'taxonomy.view'],
  ['/studio/collections', 'collections.view'], ['/studio/categories', 'categories.view'],
  ['/studio/brands', 'brands.view'], ['/studio/products', 'products.view'],
  ['/studio', 'dashboard.view'],
];

export function permissionForStudioPath(pathname: string) {
  return STUDIO_ROUTE_PERMISSIONS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? 'dashboard.view';
}

export function canAccessStudioPath(role: string | null | undefined, pathname: string) {
  return roleHasPermission(role, permissionForStudioPath(pathname));
}
