'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  FolderTree,
  Layers,
  ShoppingCart,
  Truck,
  Users,
  Star,
  Boxes,
  Image as ImageIcon,
  BarChart3,
  Search,
  Sparkles,
  Settings,
  ShieldCheck,
  History,
  Gauge,
  ServerCog,
  WandSparkles,
  ClipboardCheck,
  Tags,
} from 'lucide-react';
import { roleHasPermission, type AdminPermission } from '@/lib/permissions';

export const STUDIO_NAV = [
  { href: '/studio', label: 'Dashboard', icon: LayoutDashboard, exact: true, permission: 'dashboard.view' },
  { href: '/studio/setup', label: 'Store Setup', icon: WandSparkles, permission: 'settings.view' },
  { href: '/studio/qa', label: 'QA & Launch', icon: ClipboardCheck, permission: 'qa.view' },
  { href: '/studio/products', label: 'Products', icon: Package, permission: 'products.view' },
  { href: '/studio/brands', label: 'Brands', icon: Tag, permission: 'brands.view' },
  { href: '/studio/categories', label: 'Categories', icon: FolderTree, permission: 'categories.view' },
  { href: '/studio/taxonomy', label: 'Notes & Tags', icon: Tags, permission: 'taxonomy.view' },
  { href: '/studio/collections', label: 'Collections', icon: Layers, permission: 'collections.view' },
  { href: '/studio/orders', label: 'Orders', icon: ShoppingCart, permission: 'orders.view' },
  { href: '/studio/delivery', label: 'Delivery Companies', icon: Truck, permission: 'delivery.view' },
  { href: '/studio/customers', label: 'Customers', icon: Users, permission: 'customers.view' },
  { href: '/studio/reviews', label: 'Reviews', icon: Star, permission: 'reviews.view' },
  { href: '/studio/inventory', label: 'Inventory', icon: Boxes, permission: 'inventory.view' },
  { href: '/studio/media', label: 'Media Library', icon: ImageIcon, permission: 'media.view' },
  { href: '/studio/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics.view' },
  { href: '/studio/performance', label: 'Performance', icon: Gauge, permission: 'analytics.view' },
  { href: '/studio/seo', label: 'SEO Manager', icon: Search, permission: 'seo.view' },
  {
    href: '/studio/recommendations',
    label: 'Recommendation Engine',
    icon: Sparkles,
    permission: 'recommendations.view',
  },
  { href: '/studio/settings', label: 'Settings', icon: Settings, permission: 'settings.view' },
  { href: '/studio/admins', label: 'Admin Users', icon: ShieldCheck, permission: 'admin_users.manage' },
  { href: '/studio/system-health', label: 'System Health', icon: ServerCog, permission: 'admin_users.manage' },
  { href: '/studio/activity', label: 'Activity Logs', icon: History, permission: 'activity.view' },
] satisfies Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  permission: AdminPermission;
}>;

export default function StudioSidebar({ adminRole }: { adminRole: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-0.5 overflow-y-auto p-3">
      {STUDIO_NAV.filter((item) => roleHasPermission(adminRole, item.permission)).map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active ? 'bg-studioBlue/10 text-studioBlue' : 'text-smoke hover:bg-white/5 hover:text-parchment'
            }`}
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
