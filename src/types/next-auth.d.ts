import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    role?: string;
    adminRole?: string | null;
    adminStatus?: string | null;
    sessionVersion?: number;
  }
  interface Session {
    user: {
      id: string;
      role?: string;
      adminRole?: string | null;
      adminStatus?: string | null;
      sessionVersion?: number;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    adminRole?: string | null;
    adminStatus?: string | null;
    sessionVersion?: number;
  }
}
