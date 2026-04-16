'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

export function AuthHashHandler() {
  const router = useRouter()
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('access_token=')) return
    const params = new URLSearchParams(hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (!accessToken || !refreshToken) return
    const supabase = createBrowserClient()
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error) return
        if (data?.session) {
          window.history.replaceState(null, '', window.location.pathname)
          router.replace('/dashboard')
        }
      })
  }, [router])
  return null
}
