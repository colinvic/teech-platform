import { createServerClient } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import BookingForm from './BookingForm'

interface Props {
  params: { id: string }
}

async function getTutorDetail(tutorId: string) {
  const supabase = createServerClient()

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select(`
      profile_id,
      bio,
      subjects,
      year_levels,
      hourly_rate_cents,
      rating_average,
      rating_count,
      session_count,
      pass_rate,
      profiles!inner ( full_name, pronoun_preference )
    `)
    .eq('profile_id', tutorId)
    .eq('status', 'active')
    .eq('wwc_verified', true)
    .single()

  if (!tutor) return null

  const { data: reviews } = await supabase
    .from('tutor_reviews')
    .select('id, rating, comment, created_at')
    .eq('tutor_id', tutorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5)

  const { data: availability } = await supabase
    .from('tutor_availability')
    .select('day_of_week, start_time, end_time, timezone')
    .eq('tutor_id', tutorId)
    .eq('is_active', true)
    .order('day_of_week')

  return { tutor, reviews: reviews ?? [], availability: availability ?? [] }
}

async function getParentChildren(parentId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('student_profiles')
    .select('profile_id, year_level, profiles!inner ( full_name )')
    .eq('parent_id', parentId)

  return (data ?? []).map((c) => ({
    id:        c.profile_id as string,
    name:      (c.profiles as { full_name: string }).full_name,
    yearLevel: c.year_level as number,
  }))
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const p = h < 12 ? 'am' : 'pm'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')}${p}`
}

function StarRow({ value, count }: { value: number | null; count: number }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1,2,3,4,5].map((i) => (
          <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 ${i <= Math.round(value) ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-neutral-600">{value.toFixed(1)} · {count} review{count !== 1 ? 's' : ''}</span>
    </div>
  )
}

export default async function TutorDetailPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getTutorDetail(params.id)
  if (!result) notFound()

  const { tutor, reviews, availability } = result
  const children = await getParentChildren(user.id)

  const tutorName = (tutor.profiles as { full_name: string }).full_name
  const rate = tutor.hourly_rate_cents as number

  // Group availability by day
  const availByDay: Record<number, typeof availability> = {}
  for (const slot of availability) {
    const d = slot.day_of_week as number
    availByDay[d] = availByDay[d] ?? []
    availByDay[d].push(slot)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-8">
      {/* Back */}
      <a href="/parent/tutors" className="mb-6 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        All tutors
      </a>

      {/* Profile header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{tutorName}</h1>
            <StarRow value={tutor.rating_average as number | null} count={tutor.rating_count as number} />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-teal">
              {formatCurrency(rate / 100)}
            </p>
            <p className="text-xs text-neutral-400">per hour incl. GST</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-6 border-t border-neutral-100 pt-4">
          {(tutor.session_count as number) > 0 && (
            <div>
              <p className="text-lg font-bold text-neutral-900">{tutor.session_count}</p>
              <p className="text-xs text-neutral-500">sessions</p>
            </div>
          )}
          {(tutor.pass_rate as number | null) !== null && (
            <div>
              <p className="text-lg font-bold text-neutral-900">{(tutor.pass_rate as number).toFixed(0)}%</p>
              <p className="text-xs text-neutral-500">student pass rate</p>
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-neutral-900">WWC</p>
            <p className="text-xs text-neutral-500">verified</p>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">{tutor.bio as string}</p>

        {/* Subjects */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(tutor.subjects as string[]).map((s) => (
            <span key={s} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-brand-teal">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          Years {(tutor.year_levels as number[]).sort((a,b)=>a-b).join(', ')}
        </p>
      </div>

      {/* Availability */}
      {Object.keys(availByDay).length > 0 && (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">Weekly availability</h2>
          <div className="space-y-2">
            {Object.entries(availByDay).sort(([a],[b]) => Number(a)-Number(b)).map(([day, slots]) => (
              <div key={day} className="flex items-start gap-3 text-sm">
                <span className="w-8 shrink-0 font-medium text-neutral-500">{DAY_NAMES[Number(day)]}</span>
                <div className="flex flex-wrap gap-1.5">
                  {slots.map((s, i) => (
                    <span key={i} className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                      {formatTime(s.start_time as string)} – {formatTime(s.end_time as string)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700">Reviews</h2>
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((i) => (
                  <svg key={i} viewBox="0 0 20 20" className={`h-3.5 w-3.5 ${i <= r.rating ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {r.comment && <p className="mt-1.5 text-sm text-neutral-700">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Booking form */}
      {children.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-6 text-center">
          <p className="text-sm font-medium text-neutral-600">No children linked to your account</p>
          <p className="mt-1 text-xs text-neutral-400">
            Ask your child to sign up and link their account to yours before booking.
          </p>
        </div>
      ) : (
        <BookingForm
          tutorId={params.id}
          tutorName={tutorName}
          hourlyRateCents={rate}
          children={children}
        />
      )}
    </div>
  )
}
