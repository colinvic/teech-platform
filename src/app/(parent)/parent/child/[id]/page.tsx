// @ts-nocheck
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import { ProgressBar } from '@/components/ui/card'
import { IconBack, IconBadge, IconChart, IconFlame, IconCheckCircle } from '@/components/icons'

async function getChildData(parentUserId: string, childId: string) {
  const supabase = await createServerClient()

  // Verify the requesting user is this child's parent
  const { data: parentProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', parentUserId)
    .eq('role', 'parent')
    .single<{ id: string }>()

  if (!parentProfile) return null

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id, year_level, streak_current, streak_longest, total_sections_passed, total_badges_earned, last_active_at, parent_id')
    .eq('id', childId)
    .eq('parent_id', parentProfile.id)  // Security: must be this parent's child
    .single<{
      id: string
      year_level: string
      streak_current: number
      streak_longest: number
      total_sections_passed: number
      total_badges_earned: number
      last_active_at: string | null
      parent_id: string
    }>()

  if (!studentProfile) return null

  const { data: childBaseProfile } = await supabase
    .from('profiles')
    .select('full_name, full_name')
    .eq('id', childId)
    .single<{ full_name: string | null; full_name: string }>()

  const { data: cache } = await supabase
    .from('report_card_cache')
    .select('*')
    .eq('student_id', childId)
    .single<{
      consistency_score: number
      avg_attempts_to_pass: number
      retry_improvement: number
      strongest_strand: string | null
      weakest_strand: string | null
      days_active_this_month: number
      sections_passed_this_month: number
    }>()

  // Latest learning identity
  const now = new Date()
  const { data: identity } = await supabase
    .from('learning_identities')
    .select('generated_text, generated_at, period_month, period_year')
    .eq('student_id', childId)
    .eq('period_year', now.getFullYear())
    .order('period_month', { ascending: false })
    .limit(1)
    .single<{ generated_text: string; generated_at: string; period_month: number; period_year: number }>()

  // Section progress summary
  const { data: sectionProgress } = await supabase
    .from('student_section_progress')
    .select('status, section:curriculum_sections(name, strand)')
    .eq('student_id', childId)

  // Sections needing a tutor
  const { data: failFlags } = await supabase
    .from('section_fail_flags')
    .select('section_id, fail_count, section:curriculum_sections(name)')
    .eq('student_id', childId)
    .eq('resolved', false)
    .gte('fail_count', 2)

  // Recent badges
  const { data: badges } = await supabase
    .from('badges')
    .select('id, rarity, score_percentage, issued_at, verification_url, section:curriculum_sections(name)')
    .eq('student_id', childId)
    .eq('is_revoked', false)
    .order('issued_at', { ascending: false })
    .limit(6)

  return {
    studentProfile,
    childBaseProfile,
    cache,
    identity,
    sectionProgress: sectionProgress ?? [],
    failFlags: failFlags ?? [],
    badges: badges ?? [],
  }
}

function formatStrand(strand: string) {
  return strand.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getChildData(user.id, id)
  if (!data) notFound()

  const { studentProfile, childBaseProfile, cache, identity, sectionProgress, failFlags, badges } = data
  const name = childBaseProfile?.full_name ?? childBaseProfile?.full_name ?? 'Student'

  const passed = sectionProgress.filter(s => s.status === 'passed' || s.status === 'mastered').length
  const inProgress = sectionProgress.filter(s => s.status === 'in_progress').length
  const total = sectionProgress.length

  // Strand breakdown
  const strandMap = new Map<string, { passed: number; total: number }>()
  for (const p of sectionProgress) {
    const strand = (p.section as { strand: string } | null)?.strand
    if (!strand) continue
    const existing = strandMap.get(strand) ?? { passed: 0, total: 0 }
    strandMap.set(strand, {
      passed: existing.passed + (p.status === 'passed' || p.status === 'mastered' ? 1 : 0),
      total: existing.total + 1,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/parent/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-teech-muted hover:text-teal transition-colors"
      >
        <IconBack className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="label mb-1">{studentProfile.year_level.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
          <h1 className="font-display text-3xl font-bold text-white">{name}</h1>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end mb-1">
            <IconFlame className={`w-4 h-4 ${studentProfile.streak_current > 0 ? 'text-teal' : 'text-teech-muted/30'}`} />
            <span className="text-sm font-bold text-teal">{studentProfile.streak_current}</span>
          </div>
          <p className="text-xs text-teech-muted">day streak</p>
          <p className="text-[10px] text-teech-muted/50 mt-0.5">Longest: {studentProfile.streak_longest}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Passed',      value: passed,                                    Icon: IconCheckCircle, colour: 'text-lime'  },
          { label: 'Badges',      value: studentProfile.total_badges_earned,         Icon: IconBadge,       colour: 'text-teal'  },
          { label: 'This month',  value: cache?.sections_passed_this_month ?? 0,     Icon: IconChart,       colour: 'text-teal'  },
          { label: 'In progress', value: inProgress,                                 Icon: IconFlame,       colour: 'text-amber' },
        ].map(({ label, value, Icon, colour }) => (
          <div key={label} className="bg-surface border border-teal/12 rounded-xl p-3 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${colour}`} />
            <div className={`font-display text-xl font-bold ${colour}`}>{value}</div>
            <div className="text-[9px] text-teech-muted uppercase tracking-wide mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Learning Identity */}
      {identity && (
        <div className="bg-gradient-to-br from-raised to-surface border border-teal/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="label">Learning Identity</p>
            <span className="text-[9px] text-teech-muted/60 bg-deep px-2 py-0.5 rounded-full border border-teal/8">
              {MONTH_NAMES[identity.period_month]} {identity.period_year} ÃÂ· AI generated
            </span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">{identity.generated_text}</p>
        </div>
      )}

      {/* Consistency */}
      {cache && (
        <div className="bg-surface border border-teal/15 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-2">
            <p className="label">Consistency this month</p>
            <span className="text-sm font-bold text-teal">{cache.consistency_score?.toFixed(0) ?? 0}%</span>
          </div>
          <ProgressBar value={cache.consistency_score ?? 0} colour="teal" />
          <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-teech-muted">
            <div>
              <span className="text-white/65 font-medium">Avg attempts to pass</span>
              <p className="text-teal font-bold mt-0.5">{(cache.avg_attempts_to_pass ?? 1).toFixed(1)}</p>
            </div>
            <div>
              <span className="text-white/65 font-medium">Active days this month</span>
              <p className="text-teal font-bold mt-0.5">{cache.days_active_this_month ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Strand progress */}
      {strandMap.size > 0 && (
        <div className="bg-surface border border-teal/15 rounded-2xl p-5">
          <p className="label mb-4">Progress by strand</p>
          <div className="space-y-3">
            {Array.from(strandMap.entries()).map(([strand, { passed: p, total: t }]) => (
              <div key={strand}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white/65">{formatStrand(strand)}</span>
                  <span className="text-xs text-teech-muted">{p}/{t}</span>
                </div>
                <ProgressBar
                  value={t > 0 ? Math.round((p / t) * 100) : 0}
                  colour={p === t && t > 0 ? 'lime' : 'teal'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tutor alerts */}
      {failFlags.length > 0 && (
        <div className="bg-teal/8 border border-teal/25 rounded-2xl p-5">
          <p className="label mb-3">Sections where a tutor could help</p>
          <div className="space-y-2">
            {failFlags.map(flag => {
              const f = flag as { section_id: string; fail_count: number; section: { name: string } | null }
              return (
                <div key={f.section_id} className="flex items-center justify-between bg-deep rounded-xl px-3 py-2.5">
                  <span className="text-sm text-white">{f.section?.name ?? 'Unknown section'}</span>
                  <span className="text-xs text-teal font-semibold">{f.fail_count} attempts</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-teech-muted mt-3 leading-relaxed">
            Tutor booking is coming soon. When available, each session will be targeted
            to exactly the concept {name} is finding difficult.
          </p>
        </div>
      )}

      {/* Recent badges */}
      {badges.length > 0 && (
        <div>
          <p className="label mb-3">Recent badges</p>
          <div className="grid grid-cols-3 gap-2">
            {badges.map(b => {
              const badge = b as {
                id: string
                rarity: string
                score_percentage: number
                issued_at: string
                verification_url: string
                section: { name: string } | null
              }
              const date = new Date(badge.issued_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
              return (
                <a
                  key={badge.id}
                  href={badge.verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface border border-teal/15 rounded-xl p-3 text-center hover:border-teal/35 transition-colors block"
                >
                  <div className="w-8 h-8 rounded-full border border-teal/25 flex items-center justify-center mx-auto mb-1.5">
                    <IconBadge className="w-4 h-4 text-teal" />
                  </div>
                  <p className="text-[10px] text-white/65 leading-tight truncate">
                    {badge.section?.name ?? 'Section'}
                  </p>
                  <p className="text-[10px] text-teal font-bold mt-0.5">
                    {badge.score_percentage.toFixed(0)}% ÃÂ· {date}
                  </p>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Overall progress */}
      {total > 0 && (
        <div className="bg-surface border border-teal/15 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-2">
            <p className="label">Overall curriculum progress</p>
            <span className="text-sm font-bold text-teal">
              {total > 0 ? Math.round((passed / total) * 100) : 0}%
            </span>
          </div>
          <ProgressBar value={total > 0 ? Math.round((passed / total) * 100) : 0} colour="teal" />
          <p className="text-xs text-teech-muted mt-2">{passed} of {total} sections passed</p>
        </div>
      )}
    </div>
  )
}
