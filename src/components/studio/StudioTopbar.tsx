'use client';

import Link from 'next/link';
import { Bell, Search, LogOut, Menu } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { STUDIO_NAV } from '@/components/studio/StudioSidebar';
import { roleHasPermission } from '@/lib/permissions';

export default function StudioTopbar({ adminName, roleLabel, adminRole, inventoryAlerts }: { adminName: string; roleLabel: string; adminRole: string; inventoryAlerts: { id: string; title: string; message: string; type: string }[] }) {
  const pathname = usePathname();
  return (
    <header className="relative flex h-14 items-center justify-between gap-2 border-b border-white/10 px-3 sm:gap-4 sm:px-6">
      <details className="group md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-center rounded-md border border-white/10 p-2 text-smoke hover:text-parchment" aria-label="Open Studio navigation"><Menu size={16} /></summary>
        <nav className="absolute inset-x-0 top-14 z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-white/10 bg-ink-soft p-3 shadow-2xl">
          <p className="mb-2 px-3 font-display text-sm text-parchment">Perfume <span className="text-gold">Studio</span></p>
          {STUDIO_NAV.filter((item) => roleHasPermission(adminRole, item.permission)).map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname?.startsWith(href);
            return <Link key={href} href={href} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${active ? 'bg-studioBlue/10 text-studioBlue' : 'text-smoke hover:bg-white/5 hover:text-parchment'}`}><Icon size={16} />{label}</Link>;
          })}
        </nav>
      </details>
      <form action="/studio/products" className="relative w-full max-w-sm">
        <label htmlFor="studio-product-search" className="sr-only">Search products by name or SKU</label>
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-smoke" />
        <input
          id="studio-product-search"
          name="q"
          type="text"
          placeholder="Search products or SKU..."
          className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-9 pr-3 text-xs text-parchment placeholder:text-smoke focus:border-studioBlue/50 focus:outline-none"
        />
      </form>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <details className="group relative">
          <summary className="relative flex cursor-pointer list-none items-center justify-center rounded-md border border-white/10 p-2 text-smoke hover:text-parchment" aria-label="Inventory notifications">
            <Bell size={14} />
            {inventoryAlerts.length > 0 && <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] text-ink">{inventoryAlerts.length}</span>}
          </summary>
          <div className="absolute end-0 z-50 mt-2 w-80 rounded-lg border border-white/10 bg-ink-soft p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between"><span className="text-xs text-parchment">Inventory notifications</span><Link href="/studio/inventory" className="text-[10px] text-gold-bright">Open manager</Link></div>
            {inventoryAlerts.length === 0 ? <p className="py-4 text-center text-[11px] text-smoke">No active inventory alerts.</p> : <div className="space-y-2">{inventoryAlerts.map((alert) => <Link key={alert.id} href="/studio/inventory" className="block rounded-md border border-white/10 p-2"><p className="text-[11px] text-parchment">{alert.title}</p><p className="mt-1 line-clamp-2 text-[9px] text-smoke">{alert.message}</p></Link>)}</div>}
          </div>
        </details>
        <span className="hidden text-end text-xs sm:block"><span className="block text-parchment">{adminName}</span><span className="text-[9px] text-smoke">{roleLabel}</span></span>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-1.5 text-xs text-smoke hover:text-parchment transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
