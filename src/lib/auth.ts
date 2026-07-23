import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';
import { clientIp, securityHash } from '@/lib/security';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

async function recordLogin(input: { identifierHash: string; ipHash: string; success: boolean; reason: string; userId?: string }) {
  await prisma.loginAttempt.create({ data: input });
}

async function loginBlocked(identifierHash: string, ipHash: string) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const failures = await prisma.loginAttempt.count({
    where: { success: false, createdAt: { gte: since }, OR: [{ identifierHash }, { ipHash }] },
  });
  return failures >= MAX_FAILED_ATTEMPTS;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;
      if (!user.email) return false;
      const admin = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
      if (!admin || admin.role !== 'ADMIN' || (admin.adminStatus && admin.adminStatus !== 'ACTIVE')) return false;
      await prisma.user.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
      await prisma.activityLog.create({ data: { adminId: admin.id, actorName: admin.name ?? admin.email, action: 'auth.login.google', affectedType: 'AdminSession', affectedId: admin.id, affectedName: 'Admin account' } });
      return true;
    },
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })] : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        adminScope: { label: 'Admin login', type: 'hidden' },
      },
      authorize: async (credentials, request) => {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        const adminScope = credentials?.adminScope === 'true';
        if (!email || !password) return null;

        const ip = clientIp(request.headers);
        const identifierHash = securityHash(`login:${email}`);
        const ipHash = securityHash(`ip:${ip}`);
        if (await loginBlocked(identifierHash, ipHash)) {
          await recordLogin({ identifierHash, ipHash, success: false, reason: 'RATE_LIMITED' });
          await prisma.activityLog.create({ data: { actorName: 'Unknown', action: 'auth.login.blocked', affectedType: 'AdminSession', affectedId: identifierHash.slice(0, 12), affectedName: 'Admin login', ipHash } });
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          await bcrypt.compare(password, '$2b$12$7K8sBqN1WvE7P0LFh9AjsextW0iY7C7X0xiD5Fx8lbfhvnWYuU3yG');
          await recordLogin({ identifierHash, ipHash, success: false, reason: 'INVALID_CREDENTIALS' });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        const unavailableAdmin = user.role === 'ADMIN' && user.adminStatus && user.adminStatus !== 'ACTIVE';
        if (!isValid || unavailableAdmin || (adminScope && user.role !== 'ADMIN')) {
          await recordLogin({ identifierHash, ipHash, success: false, reason: unavailableAdmin ? 'ACCOUNT_UNAVAILABLE' : 'INVALID_CREDENTIALS', userId: user.id });
          if (user.role === 'ADMIN') await prisma.activityLog.create({ data: { adminId: user.id, actorName: user.name ?? user.email, action: 'auth.login.failed', affectedType: 'AdminSession', affectedId: user.id, affectedName: 'Admin account', ipHash } });
          return null;
        }

        await prisma.$transaction([
          prisma.loginAttempt.create({ data: { identifierHash, ipHash, success: true, reason: 'SUCCESS', userId: user.id } }),
          prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
          ...(user.role === 'ADMIN' ? [prisma.activityLog.create({ data: { adminId: user.id, actorName: user.name ?? user.email, action: 'auth.login.succeeded', affectedType: 'AdminSession', affectedId: user.id, affectedName: 'Admin account', ipHash } })] : []),
        ]);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          adminRole: user.adminRole ?? (user.role === 'ADMIN' ? 'SUPER_ADMIN' : null),
          adminStatus: user.adminStatus,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
});
