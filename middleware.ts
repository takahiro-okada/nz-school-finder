import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const locale = request.cookies.get('locale')?.value ?? 'en'
  request.headers.set('x-locale', locale)
  return NextResponse.next({
    request: { headers: request.headers }
  })
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}