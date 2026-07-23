import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeAdminRole, roleHasPermission, type AdminPermission } from '@/lib/permissions';

export class AuthorizationError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function requirePermission(permission: AdminPermission) {
  const session = await auth();
  if (!session?.user?.id) throw new AuthorizationError('Authentication required.');
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, role: true, adminRole: true, adminStatus: true,
      permissionOverrides: true, deniedPermissions: true, sessionVersion: true,
      adminRoles: {
        select: {
          adminRole: {
            select: { key: true, permissions: { select: { permission: { select: { key: true } } } } },
          },
        },
      },
    },
  });
  if (!user || user.role !== 'ADMIN' || (user.adminStatus && user.adminStatus !== 'ACTIVE')) throw new AuthorizationError('Admin account is unavailable.');
  const tokenVersion = Number((session.user as { sessionVersion?: number }).sessionVersion ?? 0);
  if (user.sessionVersion !== tokenVersion) throw new AuthorizationError('Your session has changed. Sign in again.');

  const denied = user.deniedPermissions.includes(permission);
  const relationallyAllowed = user.adminRoles.some((assignment) =>
    assignment.adminRole.permissions.some((entry) => entry.permission.key === permission)
  );
  const allowed = user.permissionOverrides.includes(permission) || relationallyAllowed || roleHasPermission(user.adminRole, permission);
  if (denied || !allowed) throw new AuthorizationError();
  return { ...user, adminRole: normalizeAdminRole(user.adminRole ?? user.adminRoles[0]?.adminRole.key) };
}

export async function requireAnyPermission(...permissions: AdminPermission[]) {
  let lastError: unknown;
  for (const permission of permissions) {
    try { return await requirePermission(permission); } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new AuthorizationError();
}

export async function requireActiveAdmin() {
  return requirePermission('dashboard.view');
}

export async function requireSuperAdmin() {
  const admin = await requirePermission('admin_users.manage');
  if (admin.adminRole !== 'SUPER_ADMIN') throw new AuthorizationError('Super Admin access required.');
  return admin;
}
