import { NextResponse, NextRequest } from 'next/server';

const LOCALES = new Set(['en', 'ru', 'uz']);

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Extract first segment
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // If the path starts with a locale, set cookie and rewrite to path without it
  if (first && LOCALES.has(first)) {
    const locale = first as 'en' | 'ru' | 'uz';
    const rest = '/' + segments.slice(1).join('/');
    const url = req.nextUrl.clone();
    url.pathname = rest === '/' ? '/' : rest;
    url.search = search;
    const res = NextResponse.rewrite(url);
    res.cookies.set('lang', locale, { path: '/', httpOnly: false, sameSite: 'lax' });
    return res;
  }

  // If no locale segment, use the last chosen language from cookie when redirecting.
  if (!first || !LOCALES.has(first)) {
    const cookieLang = req.cookies.get('lang')?.value;
    const lang = cookieLang && LOCALES.has(cookieLang) ? cookieLang : 'en';
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|assets|favicon.ico).*)'],
};


