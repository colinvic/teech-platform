/**
 * teech-platform — Supabase Client
 *
 * Two clients:
 * - createBrowserClient: for use in Client Components
 * - createServerClient: for use in Server Components, Route Handlers, Server Actions
 *
 * Data residency: Supabase project MUST be in ap-southeast-2 (Sydney).
 * Student data does not leave Australia.
 */

import { createBrowserClient as supabaseCreateBrowserClient } from '@supabase/ssr'
import { createServerClient as supabaseCreateServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_ANON_KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[teech] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Check your .env.local file.'
  )
}

// ── Browser client (Client Components) ───────────────────────────────────────

export function createBrowserClient() {
  return supabaseCreateBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
}

// ── Server client (Server Components, Route Handlers, Server Actions) ─────────

export async function createServerClient() {
  const cookieStore = await cookies()

  return supabaseCreateServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method is called from Server Components where cookies
          // cannot be set. This is safe to ignore — the session will be refreshed
          // by the middleware.
        }
      },
    },
  })
}

// ── Admin client (service role — server-side only, never expose to client) ────
// Use ONLY for:
//   - Compliance audit log writes (bypasses RLS intentionally)
//   - Admin-level operations with appropriate access controls
//   - Webhook handlers
// Every use of this client must be logged in the compliance audit log.

export function createAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      '[teech] Missing SUPABASE_SERVICE_ROLE_KEY. ' +
      'This client must only be used server-side.'
    )
  }

  if (typeof window !== 'undefined') {
    throw new Error(
      '[teech] createAdminClient() must never be called client-side. ' +
      'This would expose the service role key.'
    )
  }

  return supabaseCreateServerClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
