'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Step = 'details' | 'otp'

export default function ParentRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [otp, setOtp] = useState('')

  const supabase = createBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        shouldCreateUser: true,
        data: {
          preferred_name: form.name.trim(),
          role: 'parent',
        },
      },
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('otp')
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: 'email',
    })

    setLoading(false)
    if (error) { setError('Incorrect or expired code.'); return }
    router.push('/parent/dashboard')
    router.refresh()
  }

  if (step === 'otp') {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-teech-muted text-sm mb-8">Code sent to <span className="text-white">{form.email}</span></p>
        <form onSubmit={handleOtp} className="space-y-4">
          <Input
            label="6-digit code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            required
            autoFocus
            error={error ?? undefined}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create account →
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">Parent or guardian account</h1>
      <p className="text-teech-muted text-sm mb-8">
        Monitor your child&apos;s progress, receive monthly reports, and manage tutor bookings.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Your name"
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Your preferred name"
          required
          autoFocus
        />
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="your@email.com.au"
          required
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create parent account →
        </Button>
      </form>

      <div className="mt-6 bg-teal/6 border border-teal/15 rounded-xl p-4">
        <p className="text-xs text-teech-muted leading-relaxed">
          As a parent or guardian, you have full visibility and control over your child&apos;s data.
          You can request a complete export or deletion at any time.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-teech-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-teal hover:text-teal-light transition-colors">Log in</Link>
      </p>
    </div>
  )
}
