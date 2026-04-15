// @ts-nocheck
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { ProgressBar } from '@/components/ui/card'
import Link from 'next/link'

async function getReportData() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single<{ id: string; full_name: string | null }>()

  if (!profile) return null

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('year_level, streak_current, streak_longest, total_sections_passed, total_badges_earned, last_active_at')
    .eq('id', profile.id)
    .single<{
      year_level: string
      streak_current: number
      streak_longest: number
      total_sections_passed: number
      total_badges_earned: number
      last_active_at: string | null
    }>()

  const { data: cache } = await supabase
    .from('report_card_cache')
    .select('*')
    .eq('student_id', profile.id)
    .single<{
      consistency_score: number
      avg_attempts_to_pass: number
      retry_improvement: number
      strongest_strand: string | null
      weakest_strand: string | null
      days_active_this_month: number
      sections_passed_this_month: number
    }>()

  // Current month identity
  const now = new Date()
  const { data: identity } = await supabase
    .from('learning_identities')
    .select('generated_text, generated_at')
    .eq('student_id', profile.id)
    .eq('period_month', now.getMonth() + 1)
    .eq('period_year', now.getFullYear())
    .single<{ generated_text: string; generated_at: string }>()

  // Recent badges
  const { data: badges } = await supabase
    .from('badges')
    .select('id, rarity, score_percentage, issued_at, section:curriculum_sections(name)')
    .eq('student_id', profile.id)
    .eq('is_revoked', false)
    .order('issued_at', { ascending: false })
    .limit(6)

  // Progress by strand
  const { data: strandProgress } = await supabase
    .from('student_section_progress')
    .select('status, section:curriculum_sections(strand)')
    .eq('student_id', profile.id)

  return { profile, studentProfile, cache, identity, badges, strandProgress }
}

function getConsistencyLabel(score: number) {
  if (score >= 80) return { label: 'Excellent', colour: 'text-lime' }
  if (score >= 60) return { label: 'Good', colour: 'text-teal' }
  if (score >= 40) return { label: 'Building', colour: 'text-teal' }
  return { label: 'Getting started', colour: 'text-teech-muted' }
}

function formatStrand(strand: string) {
  return strand.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default async function ReportPage() {
  const data = await getReportData()
  if (!data) redirect('/login')

  const { profile, studentProfile, cache, identity, badges, strandProgress } = data
  const name = profile.full_name ?? 'there'
  const consistency = getConsistencyLabel(cache?.consistency_score ?? 0)
  const now = new Date()
  const monthName = now.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })

  // Calculate strand breakdown
  const strandMap = new Map<string, { passed: number; total: number }>()
  for (const p of strandProgress ?? []) {
    const strand = (p.section as { strand: string } | null)?.strand
    if (!strand) continue
    const existing = strandMap.get(strand) ?? { passed: 0, total: 0 }
    strandMap.set(strand, {
      passed: existing.passed + (p.status === 'passed' || p.status === 'mastered' ? 1 : 0),
      total: existing.total + 1,
    })
  }

  const RARITY_LABELS: Record<string, string> = {
    standard: 'Pass', first_pass: 'First Attempt', perfect_score: 'Perfect Score', fast_pass: 'Fast Pass', streak: 'Streak',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="label mb-1">Your learning story</p>
        <h1 className="font-display text-3xl font-bold text-white">{name}&apos;s Report</h1>
        <p className="text-teech-muted text-xs mt-1">{monthName}</p>
      </div>

      {/* AI Learning Identity */}
      <div className="bg-gradient-to-br from-raised to-surface border border-teal/20 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-teal uppercase tracking-widest">Learning Identity</p>
          <span className="text-[10px] text-teech-muted/70 bg-deep px-2 py-0.5 rounded-full">AI generated</span>
        </div>
        {identity ? (
          <p className="text-sm text-white/75 leading-relaxed">{identity.generated_text}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-teech-muted leading-relaxed">
              Your learning identity paragraph is generated at the start of each month once you&apos;ve completed some sections.
            </p>
            <p className="text-xs text-teech-muted/70">Complete your first section to unlock your learning identity.</p>
          </div>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-teal/15 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-teech-muted mb-1">Consistency</p>
          <p className={`font-display text-2xl font-bold ${consistency.colour}`}>{consistency.label}</p>
          <ProgressBar value={cache?.consistency_score ?? 0} colour="teal" className="mt-2" />
          <p className="text-[10px] text-teech-muted/70 mt-1">{cache?.days_active_this_month ?? 0} active days this month</p>
        </div>

        <div className="bg-surface border border-teal/15 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-teech-muted mb-1">This month</p>
          <p className="font-display text-2xl font-bold text-lime">{cache?.sections_passed_this_month ?? 0}</p>
          <p className="text-xs text-teech-muted mt-1">sections passed</p>
          <p className="text-[10px] text-teech-muted/70 mt-2">
            {studentProfile?.total_sections_passed ?? 0} total all time
          </p>
        </div>

        <div className="bg-surface border border-teal/15 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-teech-muted mb-1">Streak</p>
          <p className="font-display text-2xl font-bold text-teal">{studentProfile?.streak_current ?? 0}</p>
          <p className="text-[10px] text-teech-muted/70 mt-2">Longest: {studentProfile?.streak_longest ?? 0} days</p>
        </div>

        <div className="bg-surface border border-teal/15 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-teech-muted mb-1">Avg. attempts</p>
          <p className="font-display text-2xl font-bold text-white">
            {(cache?.avg_attempts_to_pass ?? 1).toFixed(1)}
          </p>
          <p className="text-[10px] text-teech-muted/70 mt-2">to pass a section</p>
        </div>
      </div>

      {/* Strand progress */}
      {strandMap.size > 0 && (
        <div className="bg-surface border border-teal/15 rounded-2xl p-5">
          <p className="label mb-4">Progress by strand</p>
          <div className="space-y-3">
            {Array.from(strandMap.entries()).map(([strand, { passed, total }]) => (
              <div key={strand}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white/65">{formatStrand(strand)}</span>
                  <span className="text-xs text-teech-muted">{passed}/{total}</span>
                </div>
                <ProgressBar
                  value={total > 0 ? Math.round((passed / total) * 100) : 0}
                  colour={passed === total && total > 0 ? 'lime' : 'teal'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths + gaps */}
      {(cache?.strongest_strand || cache?.weakest_strand) && (
        <div className="grid grid-cols-2 gap-3">
          {cache.strongest_strand && (
            <div className="bg-lime/8 border border-lime/20 rounded-xl p-4">
              <p className="text-[10px] text-lime font-semibold uppercase tracking-wide mb-1">Strongest</p>
              <p className="text-sm text-white font-medium">{formatStrand(cache.strongest_strand)}</p>
            </div>
          )}
          {cache.weakest_strand && (
            <div className="bg-teal/8 border border-teal/20 rounded-xl p-4">
              <p className="text-[10px] text-teal font-semibold uppercase tracking-wide mb-1">Focus area</p>
              <p className="text-sm text-white font-medium">{formatStrand(cache.weakest_strand)}</p>
            </div>
          )}
        </div>
      )}

      {/* Recent badges */}
      {badges && badges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label">Recent badges</p>
            <Link href="/badges" className="text-xs text-teal hover:text-teal-light transition-colors">
              View all Ã¢ÂÂ
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {badges.map(b => {
              const badge = b as {
                id: string
                rarity: string
                score_percentage: number
                issued_at: string
                section: { name: string } | null
              }
              return (
                <div key={badge.id} className="bg-surface border border-teal/15 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">RARITY_LABELS[badge.rarity] ?? 'Pass'</div>
                  <p className="text-[10px] text-teech-muted leading-tight truncate">
                    {badge.section?.name ?? 'Section'}
                  </p>
                  <p className="text-[10px] text-teal font-bold mt-0.5">{badge.score_percentage.toFixed(0)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!strandProgress || strandProgress.length === 0) && (
        <div className="text-center py-8 space-y-3">
          <div className="w-14 h-14 rounded-full border-2 border-teal/15 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-7 h-7 text-teal/30"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
        </div>
          <p className="text-teech-muted text-sm">Your report card fills up as you learn.</p>
          <Link href="/dashboard" className="btn-primary inline-flex">Start a section Ã¢ÂÂ</Link>
        </div>
      )}
    </div>
  )
}
