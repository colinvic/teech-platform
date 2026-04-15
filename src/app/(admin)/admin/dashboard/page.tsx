import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import {
  IconGraduate, IconTutor, IconEdit,
  IconFlag, IconContent, IconAudit,
  IconBadge, IconCheckCircle,
} from '@/components/icons'

async function getAdminStats() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single<{ role: string; full_name: string | null }>()

  if (profile?.role !== 'admin') return null

  const [students, tutors, pendingQs, flaggedSessions, badges] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('tutor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('assessment_questions').select('id', { count: 'exact', head: true })
      .eq('reviewed_by_human', false).eq('is_active', false),
    supabase.from('assessment_sessions').select('id', { count: 'exact', head: true })
      .eq('flagged', true).eq('status', 'completed_pass'),
    supabase.from('badges').select('id', { count: 'exact', head: true }).eq('is_revoked', false),
  ])

  const { data: questionsToReview } = await supabase
    .from('assessment_questions')
    .select('id, question_text, difficulty, section:curriculum_sections(name)')
    .eq('reviewed_by_human', false)
    .eq('is_active', false)
    .limit(10)

  return {
    name: profile.full_name,
    stats: {
      students:         students.count ?? 0,
      activeTutors:     tutors.count ?? 0,
      pendingQuestions: pendingQs.count ?? 0,
      flaggedSessions:  flaggedSessions.count ?? 0,
      totalBadges:      badges.count ?? 0,
    },
    questionsToReview: questionsToReview ?? [],
  }
}

export default async function AdminDashboardPage() {
  const data = await getAdminStats()
  if (!data) redirect('/login')

  const { name, stats, questionsToReview } = data

  // Stat cards ÃÂ¢ÃÂÃÂ pure CSS icons, no emojis
  const statCards = [
    { label: 'Students',      value: stats.students,         Icon: IconGraduate,  alert: false },
    { label: 'Active tutors', value: stats.activeTutors,     Icon: IconTutor,     alert: false },
    { label: 'Pending Qs',   value: stats.pendingQuestions,  Icon: IconEdit,      alert: stats.pendingQuestions > 0 },
    { label: 'Flagged',       value: stats.flaggedSessions,   Icon: IconFlag,      alert: stats.flaggedSessions > 0 },
    { label: 'Badges issued', value: stats.totalBadges,       Icon: IconBadge,     alert: false },
  ]

  const quickLinks = [
    { href: '/admin/tutors',  label: 'Tutor Management',  Icon: IconTutor   },
    { href: '/admin/flags',   label: 'Flagged Sessions',  Icon: IconFlag    },
    { href: '/admin/content', label: 'Content Management',Icon: IconContent },
    { href: '/admin/audit',   label: 'Audit Log',         Icon: IconAudit   },
  ]

  return (
    <div className="min-h-screen bg-deep p-6 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="flex items-center gap-0 mb-1">
            <span className="font-display text-2xl font-black text-white">te</span>
            <span className="font-display text-2xl font-black text-teal">e</span>
            <span className="font-display text-2xl font-black text-white">ch</span>
            <span className="font-display text-2xl font-black text-teal/40">.au</span>
          </Link>
          <p className="text-xs text-teech-muted">Admin ÃÂÃÂ· {name}</p>
        </div>
        <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold tracking-widest uppercase">
          Admin
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map(({ label, value, Icon, alert }) => (
          <div
            key={label}
            className={`bg-surface border rounded-xl p-4 text-center transition-colors ${
              alert ? 'border-teal/40' : 'border-teal/12'
            }`}
          >
            <div className="flex justify-center mb-2">
              <Icon className={`w-6 h-6 ${alert ? 'text-teal' : 'text-teech-muted/60'}`} />
            </div>
            <div className={`font-display text-2xl font-bold ${alert ? 'text-teal' : 'text-white'}`}>
              {value}
            </div>
            <div className="text-[9px] text-teech-muted uppercase tracking-wide mt-0.5">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Question review queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white">Question Review Queue</h2>
          <span className="text-xs text-teech-muted">
            {stats.pendingQuestions} pending
          </span>
        </div>

        {questionsToReview.length === 0 ? (
          <div className="bg-surface border border-lime/15 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-lime text-sm font-semibold">
              <IconCheckCircle className="w-4 h-4" />
              All questions reviewed
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {questionsToReview.map(q => {
              const typedQ = (q as unknown) as {
                id: string
                question_text: string
                difficulty: number
                section: { name: string }[] | null
              }
              return (
                <div
                  key={typedQ.id}
                  className="bg-surface border border-teal/12 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-teal bg-teal/10 border border-teal/15 px-2 py-0.5 rounded font-mono truncate max-w-[140px]">
                          {typedQ.section?.[0]?.name ?? '' ?? 'Unknown section'}
                        </span>
                        <span className="text-xs text-teech-muted">
                          Difficulty {typedQ.difficulty}/3
                        </span>
                        <span className="text-[10px] text-amber bg-amber/10 border border-amber/15 px-2 py-0.5 rounded font-semibold">
                          AI Generated
                        </span>
                      </div>
                      <p className="text-sm text-white leading-relaxed">
                        {typedQ.question_text}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <form action="/api/admin/questions/approve" method="POST">
                        <input type="hidden" name="questionId" value={typedQ.id} />
                        <button
                          type="submit"
                          className="text-xs bg-lime/12 text-lime border border-lime/25 px-3 py-1.5 rounded-lg font-semibold hover:bg-lime/20 transition-colors"
                        >
                          Approve
                        </button>
                      </form>
                      <form action="/api/admin/questions/reject" method="POST">
                        <input type="hidden" name="questionId" value={typedQ.id} />
                        <button
                          type="submit"
                          className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-500/15 transition-colors"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-surface border border-teal/12 rounded-xl p-4 hover:border-teal/35 transition-colors flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-teal/8 border border-teal/15 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/15 transition-colors">
              <Icon className="w-4 h-4 text-teal/70" />
            </div>
            <span className="text-sm font-medium text-white">{label}</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
