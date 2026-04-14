'use client'

import { useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'

interface Child {
  id:        string
  name:      string
  yearLevel: number
}

interface Props {
  tutorId:          string
  tutorName:        string
  hourlyRateCents:  number
  children:         Child[]
}

const DURATIONS = [
  { label: '30 min',  value: 30,  multiplier: 0.5  },
  { label: '45 min',  value: 45,  multiplier: 0.75 },
  { label: '1 hour',  value: 60,  multiplier: 1    },
  { label: '90 min',  value: 90,  multiplier: 1.5  },
]

// Platform fee: 15%. GST is 10% of the total.
const PLATFORM_FEE_RATE = 0.15
const GST_RATE           = 0.10

function calculatePricing(rateCents: number, multiplier: number) {
  const subtotal     = Math.round(rateCents * multiplier)
  const platformFee  = Math.round(subtotal * PLATFORM_FEE_RATE)
  const gst          = Math.round(subtotal * GST_RATE)
  const total        = subtotal + gst
  return { subtotal, platformFee, gst, total }
}

// Get the next 14 days (skip today)
function getBookableDates(): Array<{ label: string; value: string; dayOfWeek: number }> {
  const dates = []
  const today = new Date()
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push({
      label:      d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }),
      value:      d.toISOString().split('T')[0],
      dayOfWeek:  d.getDay(),
    })
  }
  return dates
}

const BOOKING_TIMES = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30',
  '20:00',
]

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const p = h < 12 ? 'am' : 'pm'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')}${p}`
}

export default function BookingForm({ tutorId, tutorName, hourlyRateCents, children }: Props) {
  const [childId,   setChildId]   = useState(children[0]?.id ?? '')
  const [date,      setDate]      = useState('')
  const [time,      setTime]      = useState('')
  const [duration,  setDuration]  = useState(60)
  const [booking,   setBooking]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const durOpt     = DURATIONS.find((d) => d.value === duration) ?? DURATIONS[2]
  const pricing    = calculatePricing(hourlyRateCents, durOpt.multiplier)
  const dateOptions = getBookableDates()

  const handleBook = useCallback(async () => {
    if (!childId) { setError('Select a student.'); return }
    if (!date)    { setError('Select a date.'); return }
    if (!time)    { setError('Select a time.'); return }
    setError(null)
    setBooking(true)

    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString()

      // Step 1: Create the tutor_session record
      const sessionRes = await fetch('/api/tutor/sessions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId,
          studentId:       childId,
          scheduledAt,
          durationMinutes: duration,
        }),
      })
      const sessionJson = await sessionRes.json()
      if (!sessionJson.success) {
        setError(sessionJson.error)
        return
      }

      // Step 2: Create Stripe Checkout session
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorSessionId: sessionJson.data.sessionId }),
      })
      const checkoutJson = await checkoutRes.json()
      if (!checkoutJson.success) {
        setError(checkoutJson.error)
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = checkoutJson.data.url
    } catch {
      setError('Booking failed. Please try again.')
    } finally {
      setBooking(false)
    }
  }, [childId, date, time, duration, tutorId])

  return (
    <div className="mt-8 rounded-2xl border border-brand-teal/30 bg-teal-50/40 p-6 space-y-5">
      <h2 className="text-base font-semibold text-neutral-900">Book a session with {tutorName}</h2>

      {/* Child */}
      {children.length > 1 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="child">
            Student
          </label>
          <select
            id="child"
            className="input w-full"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — Year {c.yearLevel}</option>
            ))}
          </select>
        </div>
      )}

      {/* Duration */}
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Session duration</p>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                duration === d.value
                  ? 'bg-brand-teal text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-brand-teal'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700" htmlFor="date">
          Date
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {dateOptions.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDate(d.value)}
              className={`rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                date === d.value
                  ? 'bg-brand-teal text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-brand-teal'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      {date && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700" htmlFor="time">
            Start time
          </label>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {BOOKING_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={`rounded-lg py-2 text-sm transition-colors ${
                  time === t
                    ? 'bg-brand-teal text-white font-medium'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-brand-teal'
                }`}
              >
                {formatTime(t)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing breakdown */}
      <div className="rounded-xl bg-white border border-neutral-200 p-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Session ({durOpt.label})</span>
          <span>{formatCurrency(pricing.subtotal / 100)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>GST (10%)</span>
          <span>{formatCurrency(pricing.gst / 100)}</span>
        </div>
        <div className="flex justify-between font-semibold text-neutral-900 border-t border-neutral-100 pt-2">
          <span>Total</span>
          <span>{formatCurrency(pricing.total / 100)}</span>
        </div>
        <p className="text-xs text-neutral-400">
          Platform service fee of {formatCurrency(pricing.platformFee / 100)} is deducted from the
          tutor&#39;s earnings, not charged to you.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleBook}
        disabled={booking || !date || !time}
        className="btn-primary w-full disabled:opacity-40"
      >
        {booking ? 'Preparing checkout…' : `Pay ${formatCurrency(pricing.total / 100)} with Stripe`}
      </button>

      <p className="text-center text-xs text-neutral-400">
        You will be redirected to Stripe to complete payment securely.
        Cancellations more than 24 hours before the session are fully refunded.
      </p>
    </div>
  )
}
