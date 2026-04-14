import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import { StatusPill, SectionStatusIcon } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/card'
import { IconFlame, IconCheckCircle, IconBadge } from '@/components/icons'
import type { CurriculumSection, StudentSectionProgress } from '@/types/platform'

type SectionWithProgress = CurriculumSection & {
  progress: StudentSectionProgress | null
}

type SubjectWithSections = {
  id: string
  name: string
  learning_area: string
  sections: SectionWithProgress[]
}

async function getDashboardData() {
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
    .select('year_level, streak_current, total_sections_passed, total_badges_earned')
    .eq('id', profile.id)
    .single<{
      year_level: string
      streak_current: number
      total_sections_passed: number
      total_badges_earned: number
    }>()

  // Get active subjects for this year level
  const { data: subjects } = await supabase
    .from('curriculum_subjects')
    .select('id, name, learning_area')
    .eq('year_level', studentProfile?.year_level ?? 'year_9')
    .eq('is_active', true)

  if (!subjects?.length) return { profile, studentProfile, subjects: [] }

  // Get all sections for these subjects
  const subjectIds = subjects.map(s => s.id)
  const { data: sections } = await supabase
    .from('curriculum_sections')
    .select('*')
    .in('subject_id', subjectIds)
    .eq('is_active', true)
    .order('order_in_subject')

  // Get student progress for all sections
  const sectionIds = (sections ?? []).map(s => s.id)
  const { data: progress } = await supabase
    .from('student_section_progress')
    .select('*')
    .eq('student_id', profile.id)
    .in('section_id', sectionIds)

  const progressMap = new Map((progress ?? []).map(p => [p.section_id, p]))

  // Group sections by subject
  const subjectsWithSections: SubjectWithSections[] = (subjects ?? []).map(subject => ({
    ...subject,
    sections: ((sections ?? []) as CurriculumSection[])
      .filter(s => s.subject_id === subject.id)
      .map(s => ({
        ...s,
        progress: progressMap.get(s.id) ?? null,
      })),
  }))

  return { profile, studentProfile, subjects: subjectsWithSections }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  if (!data) redirect('/login')

  const { profile, studentProfile, subjects } = data
  const name = profile.full_name ?? 'there'
  const streak = studentProfile?.streak_current ?? 0
  const passed = studentProfile?.total_sections_passed ?? 0
  const badges = studentProfile?.total_badges_earned ?? 0

  // Calculate overall progress
  const totalSections = subjects.reduce((acc, s) => acc + s.sections.length, 0)
  const progressPercent = totalSections > 0 ? Math.round((passed / totalSections) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <p className="text-teech-muted text-sm mb-1">Good to see you,</p>
        <h1 className="font-display text-3xl font-bold text-white">{name}</h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Day streak', value: streak, Icon: IconFlame, colour: streak > 0 ? 'text-teal' : 'text-teech-muted' },
          { label: 'Passed', value: passed, Icon: IconCheckCircle, colour: 'text-lime' },
          { label: 'Badges', value: badges, Icon: IconBadge, colour: 'text-teal' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface border border-teal/15 rounded-2xl p-4 text-center">
            <stat.Icon className={`w-6 h-6 mb-1 mx-auto ${stat.colour}`} />
            <div className={`font-display text-2xl font-bold ${stat.colour}`}>{stat.value}</div>
            <div className="text-[10px] text-teech-muted uppercase tracking-wide mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {totalSections > 0 && (
        <div className="bg-surface border border-teal/15 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-white/65">Overall progress</span>
            <span className="text-sm font-bold text-teal">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} colour="teal" />
          <p className="text-xs text-teech-muted mt-2">
            {passed} of {totalSections} sections passed
          </p>
        </div>
      )}

      {/* Curriculum map â sections grouped by subject */}
      {subjects.map(subject => (
        <div key={subject.id}>
          <div className="flex items-center gap-2 mb-3">
            <span className="label">{subject.name}</span>
          </div>

          <div className="space-y-2">
            {subject.sections.map(section => {
              const status = section.progress?.status ?? 'locked'
              const score = section.progress?.assessment_best_score
              const isAvailable = status !== 'locked'

              return (
                <Link
                  key={section.id}
                  href={isAvailable ? `/section/${section.slug}/learn` : '#'}
                  className={`block bg-surface border rounded-xl p-4 transition-all duration-200 ${
                    isAvailable
                      ? 'border-teal/15 hover:border-teal/40 hover:-translate-y-0.5 active:translate-y-0'
                      : 'border-teal/8 opacity-60 cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <SectionStatusIcon status={status} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{section.name}</p>
                        <p className="text-xs text-teech-muted mt-0.5">
                          ~{section.estimated_duration_minutes} min
                          {score !== undefined && score !== null && ` Â· Best: ${score.toFixed(0)}%`}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <StatusPill
                        variant={
                          status === 'passed' || status === 'mastered' ? 'pass'
                          : status === 'in_progress' ? 'progress'
                          : status === 'available' ? 'info'
                          : 'locked'
                        }
                        label={status === 'in_progress' ? 'In progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                      />
                    </div>
                  </div>

                  {/* Progress bar for in-progress sections */}
                  {status === 'in_progress' && section.progress && (
                    <div className="mt-3">
                      <ProgressBar
                        value={section.progress.cards_total > 0
                          ? Math.round((section.progress.cards_viewed / section.progress.cards_total) * 100)
                          : 0}
                        colour="teal"
                      />
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {subjects.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-teal/15 flex items-center justify-center mx-auto mb-4">
            <IconBadge className="w-8 h-8 text-teal/40" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Content coming soon</h2>
          <p className="text-teech-muted text-sm">We&apos;re loading your curriculum. Check back shortly.</p>
        </div>
      )}
    </div>
  )
}
