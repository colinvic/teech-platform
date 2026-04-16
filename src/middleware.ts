// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/section', '/badges', '/report', '/parent', '/tutor', '/admin']
const MARKETPLACE_LIVE = process.env['NEXT_PUBLIC_MARKETPLACE_LIVE'] === 'true'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const requiresAuth = PROTECTED_ROUTES.some((route) => path.startsWith(route))

  // Presence check — does any Supabase auth cookie exist?
  const hasSession = request.cookies.getAll().some(c => 
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  if (requiresAuth && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  if (path.startsWith('/tutor') && !MARKETPLACE_LIVE) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|verify/badge).*)'],
}
