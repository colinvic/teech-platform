import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendMonthlyParentReport } from '@/lib/email'
import { logger } from '@/lib/logger'

function verifyCronSecret(request: NextRequest) {
  return request.headers.get('authorization') === `Bearer ${process.env['CRON_SECRET']}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  // Get all students who have a linked parent with email notifications enabled
  const { data: students } = await supabase
    .from('student_profiles')
    .select(`
      id, year_level, streak_current, total_sections_passed,
      parent_id,
      profile:profiles!id(preferred_name)
    `)
    .not('parent_id', 'is', null)

  for (const student of students ?? []) {
    const s = student as {
      id: string
      year_level: string
      streak_current: number
      total_sections_passed: number
      parent_id: string
      profile: { preferred_name: string | null } | null
    }

    try {
      // Get parent notification preferences
      const { data: parentProfile } = await supabase
        .from('parent_profiles')
        .select('notification_email')
        .eq('id', s.parent_id)
        .single<{ notification_email: boolean }>()

      if (!parentProfile?.notification_email) { skipped++; continue }

      // Get parent auth user for email address
      const { data: parentBaseProfile } = await supabase
        .from('profiles')
        .select('user_id, preferred_name, full_name')
        .eq('id', s.parent_id)
        .single<{ user_id: string; preferred_name: string | null; full_name: string }>()

      if (!parentBaseProfile) { skipped++; continue }

      const { data: parentUser } = await supabase.auth.admin.getUserById(parentBaseProfile.user_id)
      const parentEmail = parentUser?.user?.email
      if (!parentEmail) { skipped++; continue }

      // Get report card cache for this student
      const { data: cache } = await supabase
        .from('report_card_cache')
        .select('*')
        .eq('student_id', s.id)
        .single<{
          consistency_score: number
          avg_attempts_to_pass: number
          strongest_strand: string | null
          weakest_strand: string | null
          days_active_this_month: number
          sections_passed_this_month: number
        }>()

      // Skip if no activity this month
      if (!cache || cache.sections_passed_this_month === 0 && cache.days_active_this_month === 0) {
        skipped++
        continue
      }

      // Build recommended action
      let recommendedAction = ''
      if (cache.weakest_strand) {
        const strand = cache.weakest_strand.replace(/_/g, ' ')
        recommendedAction = `Focus on ${strand} — this is the strand with the most incomplete sections. Encourage ${s.profile?.preferred_name ?? 'your student'} to try one section this week.`
      } else if (cache.sections_passed_this_month === 0) {
        recommendedAction = `${s.profile?.preferred_name ?? 'Your student'} has not passed a section this month yet. Encourage them to log in and attempt the next available section — even 15 minutes helps.`
      } else if (s.streak_current === 0) {
        recommendedAction = `The study streak has broken. Help ${s.profile?.preferred_name ?? 'your student'} restart it — even one short session today resets the momentum.`
      } else {
        recommendedAction = `${s.profile?.preferred_name ?? 'Your student'} is making solid progress. Keep the ${s.streak_current}-day streak going — consistency is the strongest predictor of long-term results.`
      }

      const studentName = s.profile?.preferred_name ?? 'Your student'
      const parentName = parentBaseProfile.preferred_name ?? parentBaseProfile.full_name ?? 'there'

      await sendMonthlyParentReport({
        parentEmail,
        parentName,
        studentName,
        sectionsPassedThisMonth: cache.sections_passed_this_month,
        totalPassed: s.total_sections_passed,
        streakCurrent: s.streak_current,
        consistencyScore: cache.consistency_score,
        strongestStrand: cache.strongest_strand,
        weakestStrand: cache.weakest_strand,
        recommendedAction,
      })

      // Log for compliance — record that monthly report was sent
      await supabase.from('compliance_audit_log').insert({
        actor_id: null,
        actor_role: 'system',
        action: 'parent_report.sent',
        table_name: 'student_profiles',
        record_id: s.id,
        after_data: {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          parent_email: parentEmail,
        },
      })

      logger.info('parent-report-cron', 'Monthly report sent', {
        studentId: s.id,
        month: now.getMonth() + 1,
      })

      sent++
    } catch (err) {
      errors.push(`${s.id}: ${String(err)}`)
      logger.error('parent-report-cron', 'Failed to send monthly report', {
        studentId: s.id,
        error: String(err),
      })
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    errors: errors.length,
    timestamp: now.toISOString(),
  })
}
