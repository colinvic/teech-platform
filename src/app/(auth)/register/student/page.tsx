// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { YEAR_LEVEL_LABELS } from '@/lib/constants'
import type { YearLevel } from '@/types/platform'

type Step = 'details' | 'otp' | 'parent_required'

const YEAR_LEVELS = Object.entries(YEAR_LEVEL_LABELS) as [YearLevel, string][]

// Under-18 threshold Ã¢ÂÂ Year 9 = ~14yo. We require parental consent for all students.
// Parental consent is always required for under-18. We ask year level and gate accordingly.
const REQUIRES_PARENT_CONSENT: YearLevel[] = [
  'foundation','year_1','year_2','year_3','year_4',
  'year_5','year_6','year_7','year_8',
  'year_9','year_10','year_11','year_12',
]

export default function StudentRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    preferredName: '',
    email: '',
    yearLevel: '' as YearLevel | '',
    parentEmail: '',
  })
  const [otp, setOtp] = useState('')

  const supabase = createBrowserClient()
  const needsParent = form.yearLevel ? REQUIRES_PARENT_CONSENT.includes(form.yearLevel) : false

  function updateForm(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.yearLevel) { setError('Please select your year level.'); return }
    if (needsParent && !form.parentEmail) { setError('A parent or guardian email is required for students under 18.'); return }
    if (needsParent && form.parentEmail === form.email) { setError('Parent or guardian email must be different from your email.'); return }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        shouldCreateUser: true,
        data: {
          full_name: form.preferredName.trim(),
          year_level: form.yearLevel,
          role: 'student',
          parent_email: needsParent ? form.parentEmail : null,
        },
      },
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('otp')
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: 'email',
    })

    setLoading(false)
    if (error) { setError('That code is incorrect or has expired.'); return }

    router.push('/dashboard')
    router.refresh()
  }

  if (step === 'otp') {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-teech-muted text-sm mb-8">
          We sent a 6-digit code to <span className="text-white">{form.email}</span>.
          {needsParent && ' We also sent a consent request to your parent or guardian.'}
        </p>
        <form onSubmit={handleOtpSubmit} className="space-y-4">
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
            Verify and start learning Ã¢ÂÂ
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">Start learning free</h1>
      <p className="text-teech-muted text-sm mb-8">
        ACARA-aligned. Mobile-first. Built for every Australian student.
      </p>

      <form onSubmit={handleDetailsSubmit} className="space-y-5">
        <Input
          label="What should we call you?"
          type="text"
          value={form.preferredName}
          onChange={e => updateForm('preferredName', e.target.value)}
          placeholder="Your preferred name"
          required
          autoComplete="given-name"
          hint="This appears on your badges and report card."
        />

        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={e => updateForm('email', e.target.value)}
          placeholder="your@email.com.au"
          required
          autoComplete="email"
        />

        <div>
          <label className="block text-sm font-medium text-white/65 mb-1.5">
            Year level <span className="text-teal">*</span>
          </label>
          <select
            value={form.yearLevel}
            onChange={e => updateForm('yearLevel', e.target.value)}
            required
            className="w-full bg-deep border border-teal/25 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          >
            <option value="">Select your year levelÃ¢ÂÂ¦</option>
            {YEAR_LEVELS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Parental consent gate Ã¢ÂÂ Privacy Act + Children's Privacy Code */}
        {needsParent && (
          <div className="bg-teal/8 border border-teal/20 rounded-xl p-4 space-y-3">
            <p className="text-xs text-teal font-semibold uppercase tracking-wide">
              Parent or guardian required
            </p>
            <p className="text-xs text-teech-muted leading-relaxed">
              Because you&apos;re under 18, we need your parent or guardian&apos;s consent
              to create your account. They&apos;ll receive an email to approve.
            </p>
            <Input
              label="Parent or guardian email"
              type="email"
              value={form.parentEmail}
              onChange={e => updateForm('parentEmail', e.target.value)}
              placeholder="parent@email.com.au"
              required={needsParent}
              autoComplete="off"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create account Ã¢ÂÂ
        </Button>
      </form>

      {/* Platform principles Ã¢ÂÂ transparency */}
      <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-teech-muted/70">
        {['No password needed','Data stays in Australia','No ads ever','Free to start'].map(item => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-teech-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-teal hover:text-teal-light transition-colors">
          Log in
        </Link>
      </p>
    </div>
  )
}
