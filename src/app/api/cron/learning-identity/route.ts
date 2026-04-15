// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateLearningIdentity } from '@/lib/claude'
import type { AgeTier, LearningIdentityData } from '@/types/platform'

function verifyCronSecret(request: NextRequest) {
  return request.headers.get('authorization') === `Bearer ${process.env['CRON_SECRET']}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Get all active students with their age tier and report card cache
  const { data: students } = await supabase
    .from('student_profiles')
    .select('id, age_tier')

  if (!students?.length) return NextResponse.json({ generated: 0 })

  let generated = 0
  let skipped = 0
  const errors: string[] = []

  for (const student of students as Array<{ id: string; age_tier: AgeTier }>) {
    try {
      // Skip if already generated this month
      const { data: existing } = await supabase
        .from('learning_identities')
        .select('id')
        .eq('student_id', student.id)
        .eq('period_month', month)
        .eq('period_year', year)
        .single()

      if (existing) { skipped++; continue }

      // Get report card cache data
      const { data: cache } = await supabase
        .from('report_card_cache')
        .select('*')
        .eq('student_id', student.id)
        .single<{
          consistency_score: number
          avg_attempts_to_pass: number
          retry_improvement: number
          peak_day_of_week: number | null
          peak_hour_of_day: number | null
          strongest_strand: string | null
          weakest_strand: string | null
          days_active_this_month: number
          sections_passed_this_month: number
        }>()

      // Get streak
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('streak_current, last_active_at')
        .eq('id', student.id)
        .single<{ streak_current: number; last_active_at: string | null }>()

      const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
      const peakDay = cache?.peak_day_of_week != null ? (dayNames[cache.peak_day_of_week] ?? null) : null

      const daysSinceLast = sp?.last_active_at
        ? Math.floor((Date.now() - new Date(sp.last_active_at).getTime()) / 86400000)
        : 999

      const data: LearningIdentityData = {
        sections_passed: cache?.sections_passed_this_month ?? 0,
        sections_attempted: cache?.days_active_this_month ?? 0,
        strongest_strand: cache?.strongest_strand ?? null,
        weakest_strand: cache?.weakest_strand ?? null,
        avg_attempts_to_pass: cache?.avg_attempts_to_pass ?? 1.5,
        consistency_score: cache?.consistency_score ?? 0,
        peak_performance_day: peakDay,
        peak_performance_hour: cache?.peak_hour_of_day ?? null,
        streak_current: sp?.streak_current ?? 0,
        retry_improvement_rate: cache?.retry_improvement ?? 0,
        days_since_last_session: daysSinceLast,
      }

      // Only generate if student has some activity
      if (data.sections_passed === 0 && data.consistency_score === 0) {
        skipped++
        continue
      }

      const text = await generateLearningIdentity(data, student.age_tier)

      await supabase.from('learning_identities').insert({
        student_id: student.id,
        period_month: month,
        period_year: year,
        generated_text: text,
        data_snapshot: data,
        generated_at: now.toISOString(),
      })

      generated++
    } catch (err) {
      errors.push(`${student.id}: ${String(err)}`)
    }
  }

  // Audit log
  await supabase.from('compliance_audit_log').insert({
    actor_id: null,
    actor_role: 'system',
    action: 'learning_identity.batch_generated',
    after_data: { month, year, generated, skipped, errors: errors.length },
  })

  return NextResponse.json({
    generated,
    skipped,
    errors: errors.length,
    timestamp: now.toISOString(),
  })
}
