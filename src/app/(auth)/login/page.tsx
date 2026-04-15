// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState } from 'react'
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

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setLoading(false)
    if (error) {
      setError('We couldn\'t find an account with that email. Please check and try again.')
      return
    }
    setStep('otp')
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    setLoading(false)
    if (error) {
      setError('That code is incorrect or has expired. Please try again.')
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          {step === 'email' ? 'Welcome back' : 'Check your email'}
        </h1>
        <p className="text-teech-muted text-sm">
          {step === 'email'
            ? 'Enter your email to receive a login code.'
            : `We sent a 6-digit code to ${email}.`}
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com.au"
            required
            autoComplete="email"
            autoFocus
            error={error ?? undefined}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Send login code Ã¢ÂÂ
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <Input
            label="6-digit code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            required
            autoFocus
            error={error ?? undefined}
            hint="Code expires in 10 minutes"
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Log in Ã¢ÂÂ
          </Button>
          <button
            type="button"
            className="w-full text-sm text-teech-muted hover:text-teal transition-colors"
            onClick={() => { setStep('email'); setError(null); setOtp('') }}
          >
            Back Ã¢ÂÂ use a different email
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-teech-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register/student" className="text-teal hover:text-teal-light transition-colors">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
