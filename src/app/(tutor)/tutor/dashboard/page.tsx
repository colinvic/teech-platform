import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import { IconVerified, IconShield, IconBadge, IconClock, IconWarning } from '@/components/icons'
import { StatusPill } from '@/components/ui/card'

async function getTutorData() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single<{ id: string; full_name: string | null }>()

  if (!profile) return null

  const { data: tutorProfile } = await supabase
    .from('tutor_profiles')
    .select('status, rating, sessions_completed, wwc_verified_at, wwc_expiry, stripe_account_id, abn')
    .eq('id', profile.id)
    .single<{
      status: string
      rating: number | null
      sessions_completed: number
      wwc_verified_at: string | null
      wwc_expiry: string | null
      stripe_account_id: string | null
      abn: string | null
    }>()

  // Upcoming confirmed sessions
  const { data: upcomingSessions } = await supabase
    .from('tutor_sessions')
    .select(`
      id, scheduled_at, duration_minutes, status,
      section:curriculum_sections(name),
      student:profiles!student_id(full_name)
    `)
    .eq('tutor_id', profile.id)
    .eq('status', 'confirmed')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(5)

  return { profile, tutorProfile, upcomingSessions: upcomingSessions ?? [] }
}

const STATUS_LABELS: Record<string, string> = {
  pending:      'Application pending review',
  under_review: 'Under review â WWC verification in progress',
  active:       'Active â accepting bookings',
  suspended:    'Suspended â action required',
  terminated:   'Account terminated',
}

export default async function TutorDashboardPage() {
  const data = await getTutorData()
  if (!data) redirect('/login')

  const { profile, tutorProfile, upcomingSessions } = data
  const name = profile.full_name ?? 'there'
  const status = tutorProfile?.status ?? 'pending'
  const isActive = status === 'active'

  // WWC expiry check
  const wwcExpiry = tutorProfile?.wwc_expiry ? new Date(tutorProfile.wwc_expiry) : null
  const daysUntilExpiry = wwcExpiry
    ? Math.floor((wwcExpiry.getTime() - Date.now()) / 86400000)
    : null
  const wwcWarning = daysUntilExpiry !== null && daysUntilExpiry <= 60

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-teech-muted text-sm mb-1">Welcome back,</p>
        <h1 className="font-display text-3xl font-bold text-white">{name}</h1>
      </div>

      {/* Account status */}
      <div className={`border rounded-2xl p-5 ${isActive ? 'bg-surface border-teal/15' : 'bg-amber/5 border-amber/25'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="label mb-1">Account status</p>
            <p className="text-sm text-white/80">{STATUS_LABELS[status] ?? status}</p>
          </div>
          <StatusPill
            variant={isActive ? 'pass' : 'pending'}
            label={isActive ? 'Active' : 'Pending'}
          />
        </div>

        {!isActive && status === 'pending' && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-teech-muted leading-relaxed">
              Your application is being reviewed. Verification steps:
            </p>
            {[
              { label: 'ABN verified',                   done: !!tutorProfile?.abn        },
              { label: 'Working With Children Check',     done: !!tutorProfile?.wwc_verified_at },
              { label: 'Stripe Connect account linked',   done: !!tutorProfile?.stripe_account_id },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                {done
                  ? <IconVerified className="w-3.5 h-3.5 text-lime flex-shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border border-teech-muted/30 flex-shrink-0" />
                }
                <span className={done ? 'text-white/65' : 'text-teech-muted/60'}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WWC expiry warning */}
      {wwcWarning && (
        <div className="bg-red-500/8 border border-red-500/25 rounded-xl p-4 flex items-start gap-3">
          <IconWarning className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400 mb-0.5">WWC Check expiring soon</p>
            <p className="text-xs text-teech-muted leading-relaxed">
              Your Working With Children Check expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}.
              Please renew and send your new check number to{' '}
              <a href="mailto:support@teech.au" className="text-teal hover:underline">support@teech.au</a>.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {isActive && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessions',  value: tutorProfile?.sessions_completed ?? 0, Icon: IconBadge   },
            { label: 'Rating',    value: tutorProfile?.rating?.toFixed(1) ?? 'â', Icon: IconVerified },
            { label: 'Response',  value: '< 2h',                                  Icon: IconClock    },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="bg-surface border border-teal/12 rounded-xl p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1.5 text-teal/60" />
              <div className="font-display text-xl font-bold text-teal">{value}</div>
              <div className="text-[9px] text-teech-muted uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming sessions */}
      {isActive && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label">Upcoming sessions</p>
            <Link href="/tutor/sessions" className="text-xs text-teal hover:text-teal-light transition-colors">
              View all
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="bg-surface border border-teal/12 rounded-xl p-6 text-center">
              <IconClock className="w-8 h-8 text-teal/20 mx-auto mb-2" />
              <p className="text-sm text-teech-muted">No upcoming sessions.</p>
              <p className="text-xs text-teech-muted/60 mt-1">
                Sessions are booked automatically when students need help.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingSessions.map(session => {
                const s = session as {
                  id: string
                  scheduled_at: string
                  duration_minutes: number
                  status: string
                  section: { name: string } | null
                  student: { full_name: string | null } | null
                }
                const when = new Date(s.scheduled_at).toLocaleDateString('en-AU', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })
                return (
                  <div key={s.id} className="bg-surface border border-teal/12 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{s.section?.name ?? 'Section'}</p>
                      <p className="text-xs text-teech-muted mt-0.5">{when} Â· {s.duration_minutes} min</p>
                    </div>
                    <StatusPill variant="pending" label="Confirmed" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Compliance note */}
      <div className="flex items-start gap-3 bg-teal/4 border border-teal/10 rounded-xl p-4">
        <IconShield className="w-4 h-4 text-teal/50 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-teech-muted/70 leading-relaxed">
          You are engaged as an independent contractor. You are responsible for your own
          tax obligations. Monthly earnings summaries are available in Earnings.
          For support contact{' '}
          <a href="mailto:support@teech.au" className="text-teal/70 hover:text-teal transition-colors">
            support@teech.au
          </a>.
        </p>
      </div>
    </div>
  )
}
