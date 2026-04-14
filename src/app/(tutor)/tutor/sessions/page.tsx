import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { StatusPill } from '@/components/ui/card'
import { IconClock, IconCheckCircle } from '@/components/icons'

async function getTutorSessions() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles').select('id')
    .eq('id', user.id).single<{ id: string }>()

  if (!profile) return null

  const { data: upcoming } = await supabase
    .from('tutor_sessions')
    .select(`id, scheduled_at, duration_minutes, status,
      section:curriculum_sections(name),
      student:profiles!student_id(full_name)`)
    .eq('tutor_id', profile.id)
    .in('status', ['confirmed', 'in_progress'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')

  const { data: past } = await supabase
    .from('tutor_sessions')
    .select(`id, scheduled_at, duration_minutes, status, post_session_pass,
      section:curriculum_sections(name),
      student:profiles!student_id(full_name),
      review:session_reviews(rating)`)
    .eq('tutor_id', profile.id)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: false })
    .limit(20)

  return { profile, upcoming: upcoming ?? [], past: past ?? [] }
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function TutorSessionsPage() {
  const data = await getTutorSessions()
  if (!data) redirect('/login')
  const { upcoming, past } = data

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="label mb-1">Your schedule</p>
        <h1 className="font-display text-3xl font-bold text-white">Sessions</h1>
      </div>

      {/* Upcoming */}
      <div>
        <p className="text-xs font-semibold text-teech-muted uppercase tracking-widest mb-3">
          Upcoming ({upcoming.length})
        </p>
        {upcoming.length === 0 ? (
          <div className="bg-surface border border-teal/12 rounded-xl p-6 text-center">
            <IconClock className="w-8 h-8 text-teal/20 mx-auto mb-2" />
            <p className="text-sm text-teech-muted">No upcoming sessions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(s => {
              const session = s as {
                id: string; scheduled_at: string; duration_minutes: number; status: string
                section: { name: string } | null; student: { full_name: string | null } | null
              }
              return (
                <div key={session.id} className="bg-surface border border-teal/15 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{session.section?.name}</p>
                      <p className="text-xs text-teech-muted mt-0.5">
                        {session.student?.full_name ?? 'Student'} Â· {session.duration_minutes} min
                      </p>
                    </div>
                    <StatusPill variant="pending" label="Confirmed" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-teal">
                    <IconClock className="w-3.5 h-3.5" />
                    {formatWhen(session.scheduled_at)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Past sessions */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-teech-muted uppercase tracking-widest mb-3">
            Completed ({past.length})
          </p>
          <div className="space-y-2">
            {past.map(s => {
              const session = s as {
                id: string; scheduled_at: string; duration_minutes: number; status: string
                post_session_pass: boolean | null
                section: { name: string } | null; student: { full_name: string | null } | null
                review: Array<{ rating: number }> | null
              }
              const rating = session.review?.[0]?.rating
              return (
                <div key={session.id} className="bg-surface border border-teal/8 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{session.section?.name}</p>
                    <p className="text-xs text-teech-muted mt-0.5">{formatWhen(session.scheduled_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.post_session_pass === true && (
                      <IconCheckCircle className="w-4 h-4 text-lime" title="Student passed post-session" />
                    )}
                    {rating && (
                      <span className="text-xs text-amber font-bold">{rating}.0</span>
                    )}
                    <StatusPill variant="pass" label="Done" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
