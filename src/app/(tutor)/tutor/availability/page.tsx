// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'

// ââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface Slot {
  id?:        string
  dayOfWeek:  number
  startTime:  string
  endTime:    string
  timezone:   string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIMEZONES = [
  { label: 'AWST â Perth',     value: 'Australia/Perth'    },
  { label: 'ACST â Darwin',    value: 'Australia/Darwin'   },
  { label: 'ACST â Adelaide',  value: 'Australia/Adelaide' },
  { label: 'AEST â Brisbane',  value: 'Australia/Brisbane' },
  { label: 'AEST â Sydney',    value: 'Australia/Sydney'   },
  { label: 'AEST â Melbourne', value: 'Australia/Melbourne'},
  { label: 'AEST â Hobart',    value: 'Australia/Hobart'   },
]

// 7:00 AM to 9:30 PM in 30-min increments
const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2,'0')}:00`)
  if (h < 21) TIME_OPTIONS.push(`${String(h).padStart(2,'0')}:30`)
}
TIME_OPTIONS.push('21:30', '22:00')

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'am' : 'pm'
  const hour   = h % 12 || 12
  return `${hour}:${String(m).padStart(2,'0')} ${period}`
}

export default function TutorAvailabilityPage() {
  const [slots,     setSlots]     = useState<Slot[]>([])
  const [timezone,  setTimezone]  = useState('Australia/Perth')
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // ââ Load existing slots ââ
  useEffect(() => {
    fetch('/api/tutor/availability')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          setSlots(json.data.map((s: { id: string; day_of_week: number; start_time: string; end_time: string; timezone: string }) => ({
            id:        s.id,
            dayOfWeek: s.day_of_week,
            startTime: s.start_time.slice(0, 5),
            endTime:   s.end_time.slice(0, 5),
            timezone:  s.timezone,
          })))
          if (json.data[0]?.timezone) setTimezone(json.data[0].timezone)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ââ Add a new slot ââ
  const addSlot = useCallback((day: number) => {
    setSlots((prev) => [
      ...prev,
      { dayOfWeek: day, startTime: '09:00', endTime: '10:00', timezone },
    ])
  }, [timezone])

  // ââ Remove a slot ââ
  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ââ Update a slot field ââ
  const updateSlot = useCallback(<K extends keyof Slot>(index: number, key: K, value: Slot[K]) => {
    setSlots((prev) => prev.map((s, i) => i === index ? { ...s, [key]: value } : s))
  }, [])

  // ââ Save ââ
  const save = useCallback(async () => {
    setError(null)
    setSaving(true)
    setSaved(false)

    // Validate
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        setError(`Start time must be before end time on ${DAYS[slot.dayOfWeek]}.`)
        setSaving(false)
        return
      }
    }

    // Apply timezone to all slots before saving
    const slotsToSave = slots.map((s) => ({ ...s, timezone }))

    try {
      const res  = await fetch('/api/tutor/availability', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slots: slotsToSave }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Failed to save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }, [slots, timezone])

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
      </div>
    )
  }

  const slotsByDay = DAYS.map((_, d) => ({
    day:   d,
    slots: slots.map((s, i) => ({ ...s, index: i })).filter((s) => s.dayOfWeek === d),
  }))

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Availability</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Set your recurring weekly availability. Parents can only book sessions within these times.
        </p>
      </div>

      {/* Timezone */}
      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
        <label className="mb-1.5 block text-sm font-medium text-neutral-700" htmlFor="tz">
          Your timezone
        </label>
        <select
          id="tz"
          className="input w-full"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>

      {/* Day grid */}
      <div className="space-y-3">
        {slotsByDay.map(({ day, slots: daySlots }) => (
          <div key={day} className="rounded-lg border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <p className="text-sm font-semibold text-neutral-800">{DAYS[day]}</p>
              <button
                type="button"
                onClick={() => addSlot(day)}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-brand-teal hover:bg-teal-50 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
                Add slot
              </button>
            </div>

            {daySlots.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-400">No availability set for {DAYS[day]}.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {daySlots.map(({ index }) => (
                  <div key={index} className="flex items-center gap-3 px-4 py-3">
                    <select
                      className="input flex-1 text-sm"
                      value={slots[index].startTime}
                      onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                      aria-label="Start time"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{formatTime(t)}</option>
                      ))}
                    </select>

                    <span className="text-sm text-neutral-400">to</span>

                    <select
                      className="input flex-1 text-sm"
                      value={slots[index].endTime}
                      onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                      aria-label="End time"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{formatTime(t)}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${DAYS[slots[index].dayOfWeek]} slot`}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {slots.length > 0 && (
        <p className="mt-4 text-sm text-neutral-500">
          {slots.length} slot{slots.length !== 1 ? 's' : ''} across{' '}
          {new Set(slots.map((s) => s.dayOfWeek)).size} day{new Set(slots.map((s) => s.dayOfWeek)).size !== 1 ? 's' : ''}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Save */}
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Savingâ¦' : 'Save availability'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Saved
          </span>
        )}
      </div>
    </div>
  )
}
