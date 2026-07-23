import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { locales, defaultLocale } from '@/lib/i18n';
import { canAccessStudioPath } from '@/lib/permissions';
import { canonicalRedirectUrl } from '@/lib/deployment';

const { auth } = NextAuth(authConfig);

function hasLocalePrefix(pathname: string) {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

// Perfume Studio is deliberately *not* under [lang] — it's a single-language
// admin tool (see the chat response), so it's exempt from the storefront's
// locale-prefix redirect entirely, with its own auth check below instead.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  const canonicalUrl = canonicalRedirectUrl(req.nextUrl.toString());
  if (canonicalUrl) return NextResponse.redirect(canonicalUrl, 308);

  if (pathname === '/admin/login') {
    if (req.nextUrl.searchParams.get('reason') === 'session' || req.nextUrl.searchParams.get('reason') === 'idle')
      return NextResponse.next();
    const role = req.auth?.user?.role;
    const status = req.auth?.user?.adminStatus;
    if (req.auth && role === 'ADMIN' && (!status || status === 'ACTIVE')) {
      const studioUrl = req.nextUrl.clone();
      studioUrl.pathname = '/studio';
      studioUrl.search = '';
      return NextResponse.redirect(studioUrl);
    }
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const studioUrl = req.nextUrl.clone();
    studioUrl.pathname = `/studio${pathname.slice('/admin'.length)}`;
    return NextResponse.redirect(studioUrl);
  }

  if (pathname.startsWith('/studio')) {
    const role = req.auth?.user?.role;
    const adminRole = req.auth?.user?.adminRole;
    const status = req.auth?.user?.adminStatus;
    if (!req.auth || role !== 'ADMIN' || (status && status !== 'ACTIVE')) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('callbackUrl', `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    if (!canAccessStudioPath(adminRole, pathname)) {
      const deniedUrl = req.nextUrl.clone();
      deniedUrl.pathname = '/studio';
      deniedUrl.search = '?denied=1';
      return NextResponse.redirect(deniedUrl);
    }
    return NextResponse.next();
  }

  if (!hasLocalePrefix(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Skip API routes, static files, and Next internals.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
