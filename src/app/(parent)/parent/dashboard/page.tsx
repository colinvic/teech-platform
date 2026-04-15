// @ts-nocheck
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import { ProgressBar } from '@/components/ui/card'

async function getParentData() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single<{ id: string; full_name: string | null }>()

  if (!profile) return null

  // Get children linked to this parent
  const { data: children } = await supabase
    .from('student_profiles')
    .select(`
      id, year_level, streak_current, total_sections_passed, total_badges_earned, last_active_at,
      profile:profiles!id(full_name)
    `)
    .eq('parent_id', profile.id)

  const childrenWithReports = await Promise.all(
    (children ?? []).map(async child => {
      const typedChild = child as {
        id: string
        year_level: string
        streak_current: number
        total_sections_passed: number
        total_badges_earned: number
        last_active_at: string | null
        profile: { full_name: string | null } | null
      }

      const { data: cache } = await supabase
        .from('report_card_cache')
        .select('consistency_score, sections_passed_this_month, strongest_strand')
        .eq('student_id', typedChild.id)
        .single<{ consistency_score: number; sections_passed_this_month: number; strongest_strand: string | null }>()

      const { data: failFlags } = await supabase
        .from('section_fail_flags')
        .select('section_id')
        .eq('student_id', typedChild.id)
        .eq('tutor_prompt_sent', false)
        .eq('resolved', false)
        .gte('fail_count', 2)

      return { ...typedChild, cache, failFlagCount: failFlags?.length ?? 0 }
    })
  )

  return { profile, children: childrenWithReports }
}

export default async function ParentDashboardPage() {
  const data = await getParentData()
  if (!data) redirect('/login')

  const { profile, children } = data
  const name = profile.full_name ?? 'there'

  function daysSince(dateStr: string | null) {
    if (!dateStr) return null
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-teech-muted text-sm mb-1">Welcome back,</p>
        <h1 className="font-display text-3xl font-bold text-white">{name}</h1>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full border-2 border-teal/15 flex items-center justify-center mx-auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-8 h-8 text-teal/30"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <h2 className="font-display text-xl font-bold text-white">No children linked yet</h2>
          <p className="text-teech-muted text-sm max-w-xs mx-auto leading-relaxed">
            When your child creates an account with your email as their parent or guardian, they&apos;ll appear here automatically.
          </p>
          <div className="bg-surface border border-teal/15 rounded-xl p-4 text-left max-w-xs mx-auto">
            <p className="text-xs text-teech-muted leading-relaxed">
              Ask your child to sign up at{' '}
              <span className="text-teal">teech.au/register/student</span>{' '}
              and enter <span className="text-white">{profile.full_name ? 'your' : 'their parent\'s'}</span> email when prompted.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map(child => (
            <Link
              key={child.id}
              href={`/parent/child/${child.id}`}
              className="block bg-surface border border-teal/15 rounded-2xl p-5 hover:border-teal/40 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {child.profile?.full_name ?? 'Student'}
                  </h2>
                  <p className="text-xs text-teech-muted mt-0.5">
                    {child.year_level.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} ÃÂ·{' '}
                    Last active: {daysSince(child.last_active_at) ?? 'Never'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${child.streak_current > 0 ? 'bg-teal animate-spark-pulse' : 'bg-teech-muted/20'}`} aria-hidden />
                  <span className="text-xs text-teal font-bold">{child.streak_current}d streak</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Passed', value: child.total_sections_passed },
                  { label: 'Badges', value: child.total_badges_earned },
                  { label: 'This month', value: child.cache?.sections_passed_this_month ?? 0 },
                ].map(s => (
                  <div key={s.label} className="bg-deep rounded-xl p-2 text-center">
                    <div className="font-bold text-white text-sm">{s.value}</div>
                    <div className="text-[9px] text-teech-muted/70 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Consistency */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-teech-muted">Consistency</span>
                  <span className="text-teal font-semibold">{child.cache?.consistency_score?.toFixed(0) ?? 0}%</span>
                </div>
                <ProgressBar value={child.cache?.consistency_score ?? 0} colour="teal" />
              </div>

              {/* Alert: tutor needed */}
              {child.failFlagCount > 0 && (
                <div className="bg-teal/10 border border-teal/25 rounded-xl px-3 py-2 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-teal flex-shrink-0" aria-hidden="true"><path d="M13 2L4.5 13.5H11L10 22l9.5-12H13L13 2z"/></svg>
                  <p className="text-xs text-teal">
                    {child.profile?.full_name ?? 'Your child'} is stuck on {child.failFlagCount} section{child.failFlagCount !== 1 ? 's' : ''} Ã¢ÂÂ a tutor could help.
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
