import { NextResponse, type NextRequest } from 'next/server';
import { isLocale } from '@quizate/shared';
import { LOCALE_COOKIE } from '@/i18n';

/** `/lang?to=en` stores the language and returns to the home page. */
export function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to');
  const response = NextResponse.redirect(new URL('/', request.url));
  if (isLocale(to)) {
    response.cookies.set(LOCALE_COOKIE, to, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
