import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * teech-platform Middleware
 *
 * Responsibilities:
 * 1. Refresh Supabase auth session on every request
 * 2. Protect authenticated routes â redirect to /login if no session
 * 3. Protect admin routes â redirect if not admin role
 * 4. Block tutor routes until legal gate is lifted (MARKETPLACE_LIVE flag)
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/section',
  '/badges',
  '/report',
  '/parent',
  '/tutor',
  '/admin',
]

// Routes restricted to admin role only
const ADMIN_ROUTES = ['/admin']

// Tutor marketplace is gated until legal docs are signed
// Set NEXT_PUBLIC_MARKETPLACE_LIVE=true in Vercel env to enable
const MARKETPLACE_LIVE = process.env['NEXT_PUBLIC_MARKETPLACE_LIVE'] === 'true'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session â MUST be called before any auth checks
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Check if route requires authentication
  const requiresAuth = PROTECTED_ROUTES.some((route) => path.startsWith(route))

  if (requiresAuth && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(loginUrl)
  }

  // Block tutor routes if marketplace is not live
  if (path.startsWith('/tutor') && !MARKETPLACE_LIVE) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Admin route protection â check role from profile
  if (ADMIN_ROUTES.some((route) => path.startsWith(route)) && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile['role'] !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public assets
     * - api routes (handled separately)
     * - badge verification (public)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|verify/badge).*)',
  ],
}
