import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface TutorRow {
  profile_id:       string
  bio:              string
  subjects:         string[]
  year_levels:      number[]
  hourly_rate_cents:number
  rating_average:   number | null
  rating_count:     number
  session_count:    number
  profiles:         { full_name: string }
}

async function getTutors(subject?: string, yearLevel?: string): Promise<TutorRow[]> {
  const supabase = await createServerClient()

  let query = supabase
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
      profiles!inner ( full_name )
    `)
    .eq('status', 'active')
    .eq('wwc_verified', true)
    .eq('stripe_onboarding_complete', true)
    .order('rating_average', { ascending: false })

  if (subject)    query = query.contains('subjects',    [subject])
  if (yearLevel)  query = query.contains('year_levels', [parseInt(yearLevel, 10)])

  const { data } = await query
  return (data as TutorRow[]) ?? []
}

// ââ Star rating display ââââââââââââââââââââââââââââââââââââââââ
function StarRating({ value, count }: { value: number | null; count: number }) {
  if (!value) return <span className="text-xs text-neutral-400">No ratings yet</span>
  const full = Math.floor(value)
  return (
    <span className="flex items-center gap-1">
      <span className="flex">
        {[1,2,3,4,5].map((i) => (
          <svg key={i} viewBox="0 0 20 20" className={`h-3.5 w-3.5 ${i <= full ? 'text-amber-400' : 'text-neutral-200'}`} fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span className="text-xs text-neutral-500">{value.toFixed(1)} ({count})</span>
    </span>
  )
}

// ââ Tutor card ââââââââââââââââââââââââââââââââââââââââââââââââ
function TutorCard({ tutor }: { tutor: TutorRow }) {
  const bio = tutor.bio?.slice(0, 120) + (tutor.bio?.length > 120 ? 'â¦' : '')

  return (
    <Link
      href={`/parent/tutors/${tutor.profile_id}`}
      className="block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-brand-teal hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-neutral-900">{tutor.profiles.full_name}</p>
          <StarRating value={tutor.rating_average} count={tutor.rating_count} />
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-brand-teal">
            {formatCurrency(tutor.hourly_rate_cents / 100)}
          </p>
          <p className="text-xs text-neutral-400">per hour</p>
        </div>
      </div>

      {/* Bio */}
      <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{bio}</p>

      {/* Subjects */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tutor.subjects.slice(0, 4).map((s) => (
          <span key={s} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-brand-teal">
            {s}
          </span>
        ))}
        {tutor.subjects.length > 4 && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
            +{tutor.subjects.length - 4} more
          </span>
        )}
      </div>

      {/* Year levels + sessions */}
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span>Years {tutor.year_levels.sort((a,b)=>a-b).join(', ')}</span>
        {tutor.session_count > 0 && (
          <span>{tutor.session_count} session{tutor.session_count !== 1 ? 's' : ''}</span>
        )}
      </div>
    </Link>
  )
}

// ââ Page ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface PageProps {
  searchParams: { subject?: string; yearLevel?: string }
}

export default async function ParentTutorsPage({ searchParams }: PageProps) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tutors = await getTutors(searchParams.subject, searchParams.yearLevel)

  const SUBJECTS    = ['Science', 'Mathematics', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology']
  const YEAR_LEVELS = [7, 8, 9, 10, 11, 12]

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Find a tutor</h1>
        <p className="mt-1 text-sm text-neutral-500">
          All tutors have verified WWC checks. Session pricing shown includes GST.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
        <form className="flex gap-2">
          <select
            name="subject"
            defaultValue={searchParams.subject ?? ''}
            className="input shrink-0 text-sm"
            onChange={(e) => {
              const url = new URL(window.location.href)
              if (e.target.value) url.searchParams.set('subject', e.target.value)
              else url.searchParams.delete('subject')
              window.location.href = url.toString()
            }}
          >
            <option value="">All subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            name="yearLevel"
            defaultValue={searchParams.yearLevel ?? ''}
            className="input shrink-0 text-sm"
            onChange={(e) => {
              const url = new URL(window.location.href)
              if (e.target.value) url.searchParams.set('yearLevel', e.target.value)
              else url.searchParams.delete('yearLevel')
              window.location.href = url.toString()
            }}
          >
            <option value="">All year levels</option>
            {YEAR_LEVELS.map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </form>
      </div>

      {/* Results */}
      {tutors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-sm font-medium text-neutral-500">No tutors found</p>
          <p className="mt-1 text-xs text-neutral-400">Try removing a filter to see more results.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tutors.map((t) => (
            <TutorCard key={t.profile_id} tutor={t} />
          ))}
        </div>
      )}
    </div>
  )
}
