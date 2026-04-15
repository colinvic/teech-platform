// @ts-nocheck
import { createBrowserClient as supabaseCreateBrowserClient } from '@supabase/ssr'
import { createServerClient as supabaseCreateServerClient } from '@supabase/ssr'

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_ANON_KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('[teech] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
}

// Browser client â for Client Components only
export function createBrowserClient() {
  return supabaseCreateBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
}

// Server client â for Server Components, Route Handlers, Server Actions
export async function createServerClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return supabaseCreateServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Safe to ignore in Server Components â session refreshed by middleware
        }
      },
    },
  })
}

// Admin client â service role, server-side only, never expose to client
export function createAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[teech] Missing SUPABASE_SERVICE_ROLE_KEY. Server-side only.')
  }
  if (typeof window !== 'undefined') {
    throw new Error('[teech] createAdminClient() must never be called client-side.')
  }
  return supabaseCreateServerClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
