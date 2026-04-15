'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TutorAdminRow } from '@/app/api/admin/tutors/route'

// ââ Status badge ââââââââââââââââââââââââââââââââââââââââââââââ
function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-800',
    active:    'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    rejected:  'bg-neutral-100 text-neutral-500',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[value] ?? 'bg-neutral-100'}`}>
      {value}
    </span>
  )
}

// ââ Tick / cross icon âââââââââââââââââââââââââââââââââââââââââ
function Verified({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-500">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-neutral-300">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

// ââ Tutor detail drawer âââââââââââââââââââââââââââââââââââââââ
function TutorDrawer({
  tutor,
  onAction,
  onClose,
}: {
  tutor: TutorAdminRow
  onAction: (tutorId: string, action: string, note?: string) => Promise<void>
  onClose: () => void
}) {
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const act = async (action: string) => {
    setLoading(action)
    await onAction(tutor.profile_id, action, note.trim() || undefined)
    setLoading(null)
  }

  const expiryDate = tutor.wwc_expiry
    ? new Date(tutor.wwc_expiry).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const isExpiringSoon = tutor.wwc_expiry
    ? new Date(tutor.wwc_expiry) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    : false

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close"
        type="button"
      />

      <div className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5">
          <div>
            <p className="text-base font-bold text-neutral-900">{tutor.profiles?.full_name ?? 'Unknown'}</p>
            <p className="text-sm text-neutral-500">{tutor.profiles?.email ?? ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill value={tutor.status} />
            <button type="button" onClick={onClose} className="ml-2 rounded p-1 hover:bg-neutral-100">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-neutral-400">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          {/* Checklist */}
          <div className="rounded-xl border border-neutral-200 p-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Verification checklist</p>
            {[
              { label: 'KYC (Stripe Identity)',      ok: tutor.kyc_verified },
              { label: 'WWC check verified',          ok: tutor.wwc_verified },
              { label: 'Stripe Connect complete',     ok: tutor.stripe_onboarding_complete },
              { label: 'Terms accepted',              ok: !!tutor.terms_accepted_at },
              { label: 'Bio entered',                 ok: !!tutor.bio },
              { label: 'Subjects selected',           ok: tutor.subjects.length > 0 },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <Verified ok={ok} />
                <span className={ok ? 'text-neutral-700' : 'text-neutral-400'}>{label}</span>
              </div>
            ))}
          </div>

          {/* WWC details */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Working With Children</p>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Number</span>
                <span className="font-mono font-medium text-neutral-800">{tutor.wwc_number ?? 'â'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">State</span>
                <span className="font-medium text-neutral-800">{tutor.wwc_state ?? 'â'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Expiry</span>
                <span className={`font-medium ${isExpiringSoon ? 'text-amber-600' : 'text-neutral-800'}`}>
                  {expiryDate ?? 'â'}{isExpiringSoon ? ' â expiring soon' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Verified</span>
                <Verified ok={tutor.wwc_verified} />
              </div>
            </div>

            {/* WWC verification buttons */}
            <div className="mt-2 flex gap-2">
              {!tutor.wwc_verified ? (
                <button
                  type="button"
                  disabled={loading === 'verify_wwc' || !tutor.wwc_number}
                  onClick={() => act('verify_wwc')}
                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
                >
                  {loading === 'verify_wwc' ? 'Verifyingâ¦' : 'Mark WWC verified'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading === 'unverify_wwc'}
                  onClick={() => act('unverify_wwc')}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Remove WWC verification
                </button>
              )}
            </div>

            {tutor.wwc_state && tutor.wwc_number && (
              <p className="mt-2 text-xs text-neutral-400">
                Verify at:{' '}
                {wwcVerifyUrl(tutor.wwc_state, tutor.wwc_number)
                  ? <a href={wwcVerifyUrl(tutor.wwc_state, tutor.wwc_number)!} target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">
                      {tutor.wwc_state} WWC register
                    </a>
                  : `${tutor.wwc_state} WWC register`
                }
              </p>
            )}
          </div>

          {/* Profile details */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Profile</p>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subjects</span>
                <span className="text-neutral-800">{tutor.subjects.join(', ') || 'â'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Year levels</span>
                <span className="text-neutral-800">{tutor.year_levels.sort((a,b)=>a-b).join(', ') || 'â'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Rate</span>
                <span className="text-neutral-800">
                  {tutor.hourly_rate_cents ? `$${(tutor.hourly_rate_cents / 100).toFixed(0)}/hr` : 'â'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Sessions</span>
                <span className="text-neutral-800">{tutor.session_count}</span>
              </div>
              {tutor.bio && (
                <div className="pt-1">
                  <p className="text-neutral-500">Bio</p>
                  <p className="mt-1 text-neutral-700 leading-relaxed">{tutor.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400" htmlFor="admin-note">
              Admin note (optional â logged)
            </label>
            <textarea
              id="admin-note"
              rows={2}
              className="input w-full resize-none text-sm"
              placeholder="Reason for rejection or suspension (stored in audit log)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {tutor.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => act('approve')}
                  disabled={loading === 'approve' || !tutor.wwc_verified || !tutor.stripe_onboarding_complete}
                  className="btn-primary w-full disabled:opacity-40"
                >
                  {loading === 'approve' ? 'Approvingâ¦' : 'Approve tutor â go live'}
                </button>
                {(!tutor.wwc_verified || !tutor.stripe_onboarding_complete) && (
                  <p className="text-center text-xs text-amber-600">
                    {!tutor.wwc_verified ? 'WWC must be verified before approval. ' : ''}
                    {!tutor.stripe_onboarding_complete ? 'Stripe Connect must be complete.' : ''}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => act('reject')}
                  disabled={loading === 'reject'}
                  className="w-full rounded-xl border border-red-300 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  {loading === 'reject' ? 'Rejectingâ¦' : 'Reject application'}
                </button>
              </>
            )}

            {tutor.status === 'active' && (
              <button
                type="button"
                onClick={() => act('suspend')}
                disabled={loading === 'suspend'}
                className="w-full rounded-xl border border-amber-300 py-3 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40"
              >
                {loading === 'suspend' ? 'Suspendingâ¦' : 'Suspend tutor'}
              </button>
            )}

            {(tutor.status === 'suspended' || tutor.status === 'rejected') && (
              <button
                type="button"
                onClick={() => act('approve')}
                disabled={loading === 'approve' || !tutor.wwc_verified}
                className="btn-primary w-full disabled:opacity-40"
              >
                {loading === 'approve' ? 'Reactivatingâ¦' : 'Reactivate tutor'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ââ State-specific WWC register URLs âââââââââââââââââââââââââ
function wwcVerifyUrl(state: string, number: string): string | null {
  const urls: Record<string, string> = {
    WA:  'https://workingwithchildren.wa.gov.au/employers/checking-a-card',
    NSW: 'https://www.kidsguardian.nsw.gov.au/child-safe-organisations/working-with-children-check/employer/verify-a-working-with-children-check',
    VIC: 'https://www.workingwithchildren.vic.gov.au/individuals/check-a-card',
    QLD: 'https://www.bluecard.qld.gov.au/',
    SA:  'https://screening.sa.gov.au/types-of-check/working-with-children-check',
    TAS: 'https://www.justice.tas.gov.au/working_with_children',
    ACT: 'https://www.accesscanberra.act.gov.au/working-with-vulnerable-people',
    NT:  'https://nt.gov.au/emergency/community-safety/working-with-children',
  }
  return urls[state] ?? null
}

// ââ Main page âââââââââââââââââââââââââââââââââââââââââââââââââ
const STATUS_TABS = [
  { value: 'pending',   label: 'Pending review' },
  { value: 'active',    label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected',  label: 'Rejected' },
]

export default function AdminTutorsPage() {
  const [statusTab, setStatusTab]       = useState('pending')
  const [tutors,    setTutors]          = useState<TutorAdminRow[]>([])
  const [loading,   setLoading]         = useState(true)
  const [selected,  setSelected]        = useState<TutorAdminRow | null>(null)
  const [counts,    setCounts]          = useState<Record<string, number>>({})

  const fetchTutors = useCallback(async (status: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/tutors?status=${status}`)
      const json = await res.json()
      if (json.success) setTutors(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load counts for all tabs on mount
  useEffect(() => {
    const loadCounts = async () => {
      const results: Record<string, number> = {}
      await Promise.all(
        STATUS_TABS.map(async ({ value }) => {
          const res  = await fetch(`/api/admin/tutors?status=${value}`)
          const json = await res.json()
          if (json.success) results[value] = json.data.length
        })
      )
      setCounts(results)
    }
    loadCounts()
  }, [])

  useEffect(() => {
    fetchTutors(statusTab)
  }, [statusTab, fetchTutors])

  const handleAction = useCallback(async (tutorId: string, action: string, note?: string) => {
    const res  = await fetch('/api/admin/tutors', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutorId, action, note }),
    })
    const json = await res.json()
    if (json.success) {
      setSelected(null)
      await fetchTutors(statusTab)
      // Refresh counts
      const countRes  = await fetch(`/api/admin/tutors?status=${statusTab}`)
      const countJson = await countRes.json()
      if (countJson.success) setCounts((prev) => ({ ...prev, [statusTab]: countJson.data.length }))
    }
  }, [statusTab, fetchTutors])

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tutor management</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Review applications, verify WWC checks, and manage tutor status.
          </p>
        </div>
        <a href="/admin/dashboard" className="text-sm text-brand-teal hover:underline">
          Back to dashboard
        </a>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-neutral-100 p-1">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusTab(value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              statusTab === value
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {label}
            {(counts[value]??0)>0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                value === 'pending' && counts[value] > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-neutral-200 text-neutral-600'
              }`}>
                {counts[value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tutor list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
        </div>
      ) : tutors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-sm font-medium text-neutral-500">No {statusTab} tutors</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tutors.map((tutor) => (
            <button
              key={tutor.profile_id}
              type="button"
              onClick={() => setSelected(tutor)}
              className="w-full rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition-all hover:border-brand-teal hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900">{tutor.profiles?.full_name ?? 'Unknown'}</p>
                    <StatusPill value={tutor.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-500">{tutor.profiles?.email ?? ''}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Registered {new Date(tutor.created_at).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>

                {/* Quick-check dots */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {[
                    { label: 'KYC',     ok: tutor.kyc_verified },
                    { label: 'WWC',     ok: tutor.wwc_verified },
                    { label: 'Stripe',  ok: tutor.stripe_onboarding_complete },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-neutral-200'}`} />
                      <span className="text-[9px] font-medium text-neutral-400">{label}</span>
                    </div>
                  ))}
                  <svg viewBox="0 0 20 20" fill="currentColor" className="ml-2 h-4 w-4 text-neutral-300">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {tutor.subjects.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {tutor.subjects.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-brand-teal">
                      {s}
                    </span>
                  ))}
                  {tutor.subjects.length > 3 && (
                    <span className="text-xs text-neutral-400">+{tutor.subjects.length - 3} more</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <TutorDrawer
          tutor={selected}
          onAction={handleAction}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
