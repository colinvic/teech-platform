'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconShield, IconVerified, IconGraduate } from '@/components/icons'
import { AU_STATES, YEAR_LEVEL_LABELS } from '@/lib/constants'

type Step = 'details' | 'qualifications' | 'otp'

const SUBJECTS = [
  { value: 'mathematics',             label: 'Mathematics'          },
  { value: 'science',                 label: 'Science'              },
  { value: 'english',                 label: 'English'              },
  { value: 'humanities_social_sciences', label: 'Humanities & Social Sciences' },
  { value: 'technologies',            label: 'Technologies'         },
  { value: 'health_pe',               label: 'Health & PE'          },
  { value: 'arts',                    label: 'Arts'                 },
]

export default function TutorRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otp, setOtp] = useState('')

  const [form, setForm] = useState({
    preferredName: '',
    email: '',
    abn: '',
    state: '' as typeof AU_STATES[number] | '',
    wwcNumber: '',
    selectedSubjects: [] as string[],
    selectedYearLevels: [] as string[],
  })

  const supabase = createBrowserClient()

  function update(key: keyof typeof form, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError(null)
  }

  function toggleSubject(value: string) {
    setForm(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(value)
        ? prev.selectedSubjects.filter(s => s !== value)
        : [...prev.selectedSubjects, value],
    }))
  }

  function toggleYearLevel(value: string) {
    setForm(prev => ({
      ...prev,
      selectedYearLevels: prev.selectedYearLevels.includes(value)
        ? prev.selectedYearLevels.filter(y => y !== value)
        : [...prev.selectedYearLevels, value],
    }))
  }

  async function handleDetailsNext(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.abn.replace(/\s/g, '').match(/^\d{11}$/)) {
      setError('ABN must be 11 digits.')
      return
    }
    if (!form.state) { setError('Please select your primary state of operation.'); return }
    if (!form.wwcNumber.trim()) { setError('Working With Children Check number is required.'); return }
    setStep('qualifications')
  }

  async function handleQualificationsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.selectedSubjects.length === 0) { setError('Please select at least one subject.'); return }
    if (form.selectedYearLevels.length === 0) { setError('Please select at least one year level.'); return }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        shouldCreateUser: true,
        data: {
          full_name: form.preferredName.trim(),
          role: 'tutor',
          abn: form.abn.replace(/\s/g, ''),
          wwc_state: form.state,
          wwc_number: form.wwcNumber.trim(),
        },
      },
    })
    setLoading(false)
    if (signUpError) { setError(signUpError.message); return }
    setStep('otp')
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: 'email',
    })
    setLoading(false)
    if (verifyError) { setError('Incorrect or expired code.'); return }
    router.push('/tutor/dashboard')
    router.refresh()
  }

  // OTP step
  if (step === 'otp') {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-teech-muted text-sm mb-8">
          Code sent to <span className="text-white">{form.email}</span>
        </p>
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
            Complete registration
          </Button>
        </form>
      </div>
    )
  }

  // Qualifications step
  if (step === 'qualifications') {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Your teaching areas</h1>
        <p className="text-teech-muted text-sm mb-6">
          Select the subjects and year levels you are qualified to teach.
          You will complete a competency assessment for each before going live.
        </p>

        <form onSubmit={handleQualificationsSubmit} className="space-y-6">
          <div>
            <p className="text-sm font-medium text-white/80 mb-3">Subjects</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => {
                const selected = form.selectedSubjects.includes(s.value)
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSubject(s.value)}
                    className={`text-sm px-4 py-2 rounded-xl border font-medium transition-colors ${
                      selected
                        ? 'bg-teal/15 border-teal text-teal'
                        : 'bg-deep border-teal/15 text-teech-muted hover:border-teal/40'
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-white/80 mb-3">Year levels</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(YEAR_LEVEL_LABELS).map(([value, label]) => {
                const selected = form.selectedYearLevels.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleYearLevel(value)}
                    className={`text-xs px-2 py-2 rounded-lg border font-semibold transition-colors ${
                      selected
                        ? 'bg-teal/15 border-teal text-teal'
                        : 'bg-deep border-teal/15 text-teech-muted hover:border-teal/40'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="btn-ghost flex-shrink-0"
            >
              Back
            </button>
            <Button type="submit" loading={loading} className="flex-1" size="lg">
              Create account
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Details step (default)
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">Apply as a tutor</h1>
      <p className="text-teech-muted text-sm mb-6">
        All tutors are verified before going live. You will need a valid ABN and
        Working With Children Check.
      </p>

      {/* Requirements */}
      <div className="bg-surface border border-teal/15 rounded-xl p-4 mb-6 space-y-2">
        {[
          { Icon: IconGraduate, text: 'Relevant tertiary qualification in your subject area' },
          { Icon: IconShield,   text: 'Valid Australian Business Number (ABN)' },
          { Icon: IconVerified, text: 'Current Working With Children Check (state-specific)' },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-sm text-teech-muted">
            <Icon className="w-4 h-4 text-teal/60 flex-shrink-0" />
            {text}
          </div>
        ))}
      </div>

      <form onSubmit={handleDetailsNext} className="space-y-5">
        <Input
          label="Preferred name"
          type="text"
          value={form.preferredName}
          onChange={e => update('preferredName', e.target.value)}
          placeholder="How you would like to be addressed"
          required
          hint="This is what students and parents will see on your profile."
        />
        <Input
          label="Email address"
          type="email"
          value={form.email}
          onChange={e => update('email', e.target.value)}
          placeholder="your@email.com.au"
          required
        />
        <Input
          label="ABN"
          type="text"
          inputMode="numeric"
          value={form.abn}
          onChange={e => update('abn', e.target.value)}
          placeholder="00 000 000 000"
          required
          hint="11-digit Australian Business Number. Tutors operate as independent contractors."
        />

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Primary state of operation <span className="text-teal">*</span>
          </label>
          <select
            value={form.state}
            onChange={e => update('state', e.target.value)}
            required
            className="w-full bg-deep border border-teal/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
          >
            <option value="">Select stateâ¦</option>
            {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <p className="mt-1.5 text-xs text-teech-muted">
            Your Working With Children Check must be issued by this state.
          </p>
        </div>

        <Input
          label="Working With Children Check number"
          type="text"
          value={form.wwcNumber}
          onChange={e => update('wwcNumber', e.target.value)}
          placeholder="Your WWC check number"
          required
          hint="We will verify this with the issuing authority before your profile is activated."
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg">
          Continue to subjects
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-teech-muted">
        Already registered?{' '}
        <Link href="/login" className="text-teal hover:text-teal-light transition-colors">Log in</Link>
      </p>
    </div>
  )
}
