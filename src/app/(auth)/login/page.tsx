// @ts-nocheck
'use client'


export const dynamic = 'force-dynamic'


import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'


type Step = 'email' | 'otp'


export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'


  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const supabase = createBrowserClient()

  // Handle magic link implicit flow (hash-based token)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('access_token=')) return
    const params = new URLSearchParams(hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (!accessToken || !refreshToken) return
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error) return
        if (data?.session) {
          window.history.replaceState(null, '', window.location.pathname)
          router.replace(redirectTo)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)


    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
