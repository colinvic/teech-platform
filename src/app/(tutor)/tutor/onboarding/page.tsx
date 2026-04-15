// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const STEPS = ['profile', 'wwc', 'kyc', 'connect', 'complete'] as const
type Step = typeof STEPS[number]

const STEP_LABELS: Record<Step, string> = {
  profile: '1. Your profile', wwc: '2. Working With Children',
  kyc: '3. Identity verification', connect: '4. Payment setup', complete: '5. Done',
}
const YEAR_LEVELS  = [3,4,5,6,7,8,9,10,11,12] as const
const SUBJECTS     = ['Science', 'Mathematics', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology']
const WWC_STATES   = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']
const RATE_OPTIONS = [
  { label: '$30 / hr', value: 3000 }, { label: '$40 / hr', value: 4000 },
  { label: '$50 / hr', value: 5000 }, { label: '$60 / hr', value: 6000 },
  { label: '$75 / hr', value: 7500 }, { label: '$90 / hr', value: 9000 },
  { label: '$100 / hr', value: 10000 }, { label: '$120 / hr', value: 12000 },
]

export default function TutorOnboardingPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const urlStep      = searchParams.get('step') as Step | null
  const kycComplete  = searchParams.get('kyc') === 'complete'

  const [step,      setStep]     = useState<Step>(STEPS.includes(urlStep as Step) ? (urlStep as Step) : 'profile')
  const [saving,    setSaving]   = useState(false)
  const [error,     setError]    = useState<string | null>(null)
  const [kycStatus, setKycStatus]= useState<'idle'|'verified'>(kycComplete ? 'verified' : 'idle')

  // Profile
  const [bio,        setBio]       = useState('')
  const [subjects,   setSubjects]  = useState<string[]>([])
  const [yearLevels, setYears]     = useState<number[]>([])
  const [rate,       setRate]      = useState(5000)
  // WWC
  const [wwcNumber, setWwcNum]   = useState('')
  const [wwcState,  setWwcState] = useState('')
  const [wwcExpiry, setWwcExp]   = useState('')

  useEffect(() => {
    if (urlStep === 'complete') setStep('complete')
    else if (urlStep === 'connect') { setStep('connect'); if (kycComplete) setKycStatus('verified') }
  }, [urlStep, kycComplete])

  const toggleSubject = (s: string) => setSubjects(p => p.includes(s) ? p.filter(x=>x!==s) : [...p, s])
  const toggleYear    = (y: number) => setYears(p => p.includes(y) ? p.filter(x=>x!==y) : [...p, y])

  const post = useCallback(async (url: string, body: object) => {
    const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return res.json()
  }, [])

  const submitProfile = useCallback(async () => {
    if (bio.trim().length < 50) { setError('Bio must be at least 50 characters.'); return }
    if (!subjects.length)       { setError('Select at least one subject.'); return }
    if (!yearLevels.length)     { setError('Select at least one year level.'); return }
    setError(null); setSaving(true)
    try {
      const json = await post('/api/tutor/onboarding', { bio, subjects, yearLevels, hourlyRateCents: rate })
      if (!json.success) { setError(json.error); return }
      setStep('wwc')
    } finally { setSaving(false) }
  }, [bio, subjects, yearLevels, rate, post])

  const submitWwc = useCallback(async () => {
    if (!wwcNumber.trim()) { setError('Enter your WWC number.'); return }
    if (!wwcState)         { setError('Select your state.'); return }
    if (!wwcExpiry)        { setError('Enter your WWC expiry date.'); return }
    setError(null); setSaving(true)
    try {
      const json = await post('/api/tutor/wwc', { wwcNumber, wwcState, wwcExpiry })
      if (!json.success) { setError(json.error); return }
      setStep('kyc')
    } finally { setSaving(false) }
  }, [wwcNumber, wwcState, wwcExpiry, post])

  const startKyc = useCallback(async () => {
    setError(null); setSaving(true)
    try {
      const json = await post('/api/tutor/kyc', {})
      if (!json.success) { setError(json.error); return }
      window.location.href = json.data.url
    } finally { setSaving(false) }
  }, [post])

  const startConnect = useCallback(async () => {
    setError(null); setSaving(true)
    try {
      const json = await post('/api/tutor/connect', {})
      if (!json.success) { setError(json.error); return }
      window.location.href = json.data.url
    } finally { setSaving(false) }
  }, [post])

  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 bg-brand-teal px-4 py-4">
        <div className="mx-auto max-w-lg">
          <span className="text-xl font-bold tracking-tight text-white">teech</span>
          <p className="mt-0.5 text-sm text-teal-100">Tutor onboarding</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < stepIndex ? 'bg-brand-lime text-neutral-900' : i === stepIndex ? 'bg-brand-teal text-white' : 'bg-neutral-200 text-neutral-400'
                }`}>
                  {i < stepIndex ? <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : i+1}
                </div>
                {i < STEPS.length-1 && <div className={`h-0.5 flex-1 ${i < stepIndex ? 'bg-brand-lime' : 'bg-neutral-200'}`} />}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm font-medium text-neutral-500">{STEP_LABELS[step]}</p>
        </div>

        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* ââ Step 1: Profile ââ */}
        {step === 'profile' && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-neutral-900">Your tutor profile</h1><p className="mt-1 text-sm text-neutral-500">This is what parents and students will see. Be honest and specific.</p></div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="bio">About you <span className="text-red-500">*</span></label>
              <textarea id="bio" rows={5} maxLength={1000} className="input w-full resize-none" placeholder="Your teaching experience, qualifications, and approach. Minimum 50 characters." value={bio} onChange={e => setBio(e.target.value)} />
              <p className="mt-1 text-right text-xs text-neutral-400">{bio.length}/1000</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Subjects <span className="text-red-500">*</span></p>
              <div className="flex flex-wrap gap-2">{SUBJECTS.map(s => <button key={s} type="button" onClick={() => toggleSubject(s)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${subjects.includes(s) ? 'bg-brand-teal text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>{s}</button>)}</div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Year levels <span className="text-red-500">*</span></p>
              <div className="flex flex-wrap gap-2">{YEAR_LEVELS.map(y => <button key={y} type="button" onClick={() => toggleYear(y)} className={`h-10 w-10 rounded-lg text-sm font-bold transition-colors ${yearLevels.includes(y) ? 'bg-brand-teal text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>{y}</button>)}</div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Hourly rate (incl. GST) <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-4 gap-2">{RATE_OPTIONS.map(opt => <button key={opt.value} type="button" onClick={() => setRate(opt.value)} className={`rounded-lg py-2 text-sm font-medium transition-colors ${rate === opt.value ? 'bg-brand-teal text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>{opt.label}</button>)}</div>
            </div>
            <button type="button" onClick={submitProfile} disabled={saving} className="btn-primary w-full">{saving ? 'Savingâ¦' : 'Continue'}</button>
          </div>
        )}

        {/* ââ Step 2: WWC ââ */}
        {step === 'wwc' && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-neutral-900">Working With Children check</h1><p className="mt-1 text-sm text-neutral-500">A valid WWC check is mandatory before your profile goes live.</p></div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><p className="font-medium">Legal requirement</p><p className="mt-1 text-blue-700">A current WWC check is required in every Australian state and territory before working with minors.</p></div>
            <div><label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="wwcNumber">WWC number <span className="text-red-500">*</span></label><input id="wwcNumber" type="text" className="input w-full uppercase" placeholder="e.g. WWC1234567A" value={wwcNumber} onChange={e => setWwcNum(e.target.value.toUpperCase())} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="wwcState">State / Territory <span className="text-red-500">*</span></label><select id="wwcState" className="input w-full" value={wwcState} onChange={e => setWwcState(e.target.value)}><option value="">Select stateâ¦</option>{WWC_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="wwcExpiry">Expiry date <span className="text-red-500">*</span></label><input id="wwcExpiry" type="date" className="input w-full" min={new Date().toISOString().split('T')[0]} value={wwcExpiry} onChange={e => setWwcExp(e.target.value)} /></div>
            <div className="flex gap-3"><button type="button" onClick={() => setStep('profile')} className="btn-secondary flex-1">Back</button><button type="button" onClick={submitWwc} disabled={saving} className="btn-primary flex-1">{saving ? 'Savingâ¦' : 'Continue'}</button></div>
          </div>
        )}

        {/* ââ Step 3: KYC ââ */}
        {step === 'kyc' && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-neutral-900">Identity verification</h1><p className="mt-1 text-sm text-neutral-500">Verify your identity using a government-issued ID. Powered by Stripe Identity â about 2 minutes.</p></div>
            {kycStatus === 'verified' ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6 text-green-600"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p className="font-semibold text-green-800">Identity verified</p>
                <p className="text-sm text-green-700">Your government ID has been successfully verified by Stripe.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
                {[
                  { label: 'Accepted documents', desc: 'Australian passport or driver licence' },
                  { label: 'Live selfie required', desc: 'Your device camera will be used â no static uploads accepted' },
                  { label: 'Privacy protected', desc: 'Document images are stored by Stripe under their privacy policy, not teech' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50"><div className="h-2 w-2 rounded-full bg-brand-teal" /></div>
                    <div><p className="text-sm font-medium text-neutral-800">{label}</p><p className="text-xs text-neutral-500">{desc}</p></div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('wwc')} className="btn-secondary flex-1">Back</button>
              {kycStatus === 'verified'
                ? <button type="button" onClick={() => setStep('connect')} className="btn-primary flex-1">Continue to payment setup</button>
                : <button type="button" onClick={startKyc} disabled={saving} className="btn-primary flex-1">{saving ? 'Redirectingâ¦' : 'Verify identity with Stripe'}</button>
              }
            </div>
          </div>
        )}

        {/* ââ Step 4: Connect ââ */}
        {step === 'connect' && (
          <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-neutral-900">Payment setup</h1><p className="mt-1 text-sm text-neutral-500">Connect your bank account to receive payouts. Powered by Stripe â takes about 5 minutes.</p></div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
              {[
                { label: 'Bank-level security', desc: 'Stripe is PCI-DSS Level 1 certified. teech never sees your bank details.' },
                { label: 'Fortnightly payouts', desc: 'Earnings deposited directly to your nominated account. Full FY summary available.' },
                { label: 'GST handled automatically', desc: 'GST calculated and itemised on every invoice. Earnings shown ex-GST.' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-lime/20"><div className="h-2 w-2 rounded-full bg-brand-teal" /></div>
                  <div><p className="text-sm font-medium text-neutral-800">{label}</p><p className="text-xs text-neutral-500">{desc}</p></div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('kyc')} className="btn-secondary flex-1">Back</button>
              <button type="button" onClick={startConnect} disabled={saving} className="btn-primary flex-1">{saving ? 'Redirectingâ¦' : 'Set up payments with Stripe'}</button>
            </div>
          </div>
        )}

        {/* ââ Step 5: Complete ââ */}
        {step === 'complete' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-lime">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-10 w-10 text-neutral-900"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div><h1 className="text-2xl font-bold text-neutral-900">Onboarding complete</h1><p className="mt-2 text-sm text-neutral-500">Your profile is under review. Our team will verify your details and activate your account within 1â2 business days. You will receive an email when you go live.</p></div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5 text-left space-y-2">
              <p className="text-sm font-semibold text-neutral-700">What happens next</p>
              <ol className="space-y-2 text-sm text-neutral-600 list-decimal list-inside">
                <li>We verify your WWC number against your state register.</li>
                <li>Our team reviews your identity verification result from Stripe.</li>
                <li>Once approved, your profile becomes visible to parents.</li>
                <li>You will receive an email notification when you are live.</li>
              </ol>
            </div>
            <button type="button" onClick={() => router.push('/tutor/dashboard')} className="btn-primary w-full">Go to your dashboard</button>
          </div>
        )}
      </main>
    </div>
  )
}
