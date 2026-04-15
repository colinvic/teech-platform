// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  params: { id: string }  // session id
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  return (
    <div className="space-y-2">
      <div className="flex gap-3" role="radiogroup" aria-label="Rating">
        {[1,2,3,4,5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i !== 1 ? 's' : ''} Ã¢ÂÂ ${LABELS[i]}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-10 w-10 transition-colors ${
                i <= (hover || value) ? 'text-amber-400' : 'text-neutral-200'
              }`}
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      {(hover > 0 || value > 0) && (
        <p className="text-sm font-medium text-neutral-600">{LABELS[hover || value]}</p>
      )}
    </div>
  )
}

export default function ReviewPage({ params }: Props) {
  const router  = useRouter()
  const [rating,   setRating]   = useState(0)
  const [comment,  setComment]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (rating === 0) { setError('Please select a rating before submitting.'); return }
    setError(null)
    setSubmitting(true)

    try {
      const res  = await fetch('/api/tutor/review', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: params.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error)
        return
      }
      router.push('/parent/dashboard?reviewed=1')
    } catch {
      setError('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [rating, comment, params.id, router])

  const skip = useCallback(() => {
    router.push('/parent/dashboard')
  }, [router])

  return (
    <div className="mx-auto max-w-md px-4 pb-20 pt-12">
      <div className="space-y-8">
        {/* Heading */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-amber-400" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">How was the session?</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Your honest feedback helps other families find great tutors.
            Reviews are published after a short moderation period.
          </p>
        </div>

        {/* Star picker */}
        <div className="flex justify-center">
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Comment */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="comment">
            Tell us more <span className="text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="comment"
            rows={4}
            maxLength={1000}
            className="input w-full resize-none"
            placeholder="What did your child think? What worked well, and what could be improved?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-neutral-400">{comment.length}/1000</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="btn-primary w-full disabled:opacity-40"
          >
            {submitting ? 'SubmittingÃ¢ÂÂ¦' : 'Submit review'}
          </button>
          <button
            type="button"
            onClick={skip}
            className="w-full rounded-xl py-3 text-sm font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Skip for now
          </button>
        </div>

        <p className="text-center text-xs text-neutral-400">
          Reviews are shown publicly on the tutor&#39;s profile. Personal details are never published.
        </p>
      </div>
    </div>
  )
}
