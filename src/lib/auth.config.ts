import type { NextAuthConfig } from 'next-auth';

/** Edge-safe authentication settings shared with middleware. */
export const authConfig = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60, updateAge: 30 * 60 },
  pages: { signIn: '/admin/login' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const secureUser = user as { role?: string; adminRole?: string | null; adminStatus?: string | null; sessionVersion?: number };
        token.role = secureUser.role;
        token.adminRole = secureUser.adminRole;
        token.adminStatus = secureUser.adminStatus;
        token.sessionVersion = secureUser.sessionVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      if (session.user && token.role) {
        (session.user as { role?: string }).role = token.role as string;
      }
      if (session.user) {
        const secureUser = session.user as { adminRole?: string | null; adminStatus?: string | null; sessionVersion?: number };
        secureUser.adminRole = token.adminRole as string | null | undefined;
        secureUser.adminStatus = token.adminStatus as string | null | undefined;
        secureUser.sessionVersion = Number(token.sessionVersion ?? 0);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
