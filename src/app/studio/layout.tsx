import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import StudioSidebar from '@/components/studio/StudioSidebar';
import StudioTopbar from '@/components/studio/StudioTopbar';
import '../globals.css';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import StudioSessionTimeout from '@/components/studio/StudioSessionTimeout';
import { ADMIN_ROLE_LABELS, normalizeAdminRole } from '@/lib/permissions';
import { ToastProvider } from '@/components/ui/ToastProvider';

export const metadata: Metadata = {
  title: 'Perfume Studio — ScentIQ Admin',
  description: 'ScentIQ admin dashboard',
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/admin/login');
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, adminRole: true, adminStatus: true, sessionVersion: true },
  });
  if (
    !admin ||
    admin.role !== 'ADMIN' ||
    (admin.adminStatus && admin.adminStatus !== 'ACTIVE') ||
    admin.sessionVersion !== Number(session.user.sessionVersion ?? 0)
  )
    redirect('/admin/login?reason=session');
  const adminRole = normalizeAdminRole(admin.adminRole);
  const inventoryAlerts = await prisma.inventoryNotification.findMany({
    where: { resolvedAt: null },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, message: true, type: true },
  });

  return (
    <html lang="en" dir="ltr">
      <body className="bg-ink text-parchment">
        <ToastProvider>
          <StudioSessionTimeout />
          <div className="flex h-screen">
            <aside className="hidden w-60 shrink-0 border-e border-white/10 bg-ink-soft md:block">
              <div className="flex h-14 items-center border-b border-white/10 px-5 font-display text-lg">
                Perfume<span className="text-gold"> Studio</span>
              </div>
              <StudioSidebar adminRole={adminRole} />
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
              <StudioTopbar
                adminName={admin.name ?? admin.email}
                roleLabel={ADMIN_ROLE_LABELS[adminRole]}
                adminRole={adminRole}
                inventoryAlerts={inventoryAlerts}
              />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
