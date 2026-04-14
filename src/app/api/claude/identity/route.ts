import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { generateLearningIdentity } from '@/lib/claude'
import type { AgeTier, LearningIdentityData } from '@/types/platform'

const schema = z.object({
  studentId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2050),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })

    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })

    const { studentId, month, year } = parsed.data

    // Verify caller is the student or their parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single<{ id: string; role: string }>()

    if (!profile) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const isStudent = profile.id === studentId
    const isParent = profile.role === 'parent'
    const isAdmin = profile.role === 'admin'

    if (!isStudent && !isParent && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 403 })
    }

    // Get student's age tier
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('age_tier, year_level')
      .eq('id', studentId)
      .single<{ age_tier: AgeTier; year_level: string }>()

    if (!studentProfile) return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })

    // Get report card cache for this student
    const { data: cache } = await supabase
      .from('report_card_cache')
      .select('*')
      .eq('student_id', studentId)
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

    // Get total sections attempted this month
    const startOfMonth = new Date(year, month - 1, 1).toISOString()
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data: monthProgress } = await supabase
      .from('student_section_progress')
      .select('status, assessment_attempts')
      .eq('student_id', studentId)
      .gte('last_activity_at', startOfMonth)
      .lte('last_activity_at', endOfMonth)

    const { data: studentStats } = await supabase
      .from('student_profiles')
      .select('streak_current')
      .eq('id', studentId)
      .single<{ streak_current: number }>()

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const peakDay = cache?.peak_day_of_week !== null && cache?.peak_day_of_week !== undefined
      ? dayNames[cache.peak_day_of_week] ?? null : null

    const data: LearningIdentityData = {
      sections_passed: cache?.sections_passed_this_month ?? 0,
      sections_attempted: monthProgress?.length ?? 0,
      strongest_strand: cache?.strongest_strand ?? null,
      weakest_strand: cache?.weakest_strand ?? null,
      avg_attempts_to_pass: cache?.avg_attempts_to_pass ?? 1.5,
      consistency_score: cache?.consistency_score ?? 50,
      peak_performance_day: peakDay,
      peak_performance_hour: cache?.peak_hour_of_day ?? null,
      streak_current: studentStats?.streak_current ?? 0,
      retry_improvement_rate: cache?.retry_improvement ?? 0,
      days_since_last_session: 0,
    }

    const generatedText = await generateLearningIdentity(data, studentProfile.age_tier)

    // Store the learning identity
    const adminClient = createAdminClient()
    const { data: identity } = await adminClient
      .from('learning_identities')
      .upsert({
        student_id: studentId,
        period_month: month,
        period_year: year,
        generated_text: generatedText,
        data_snapshot: data,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,period_month,period_year' })
      .select('id')
      .single<{ id: string }>()

    return NextResponse.json({ success: true, data: { identityId: identity?.id, text: generatedText } })
  } catch (err) {
    logger.error('claude-identity', 'Learning identity generation failed', { error: String(err) })
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
  }
}
