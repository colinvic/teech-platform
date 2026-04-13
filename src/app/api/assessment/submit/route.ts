import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { signBadge, calculateBadgeRarity, getBadgeVerificationUrl } from '@/lib/badge'
import { calculateAnomalyScore } from '@/lib/utils'
import { ASSESSMENT } from '@/lib/constants'
import type { ApiResponse } from '@/types/platform'

const schema = z.object({
  sessionId: z.string().uuid(),
  token: z.string().min(32).max(128),
  answers: z.array(z.object({
    questionIndex: z.number().int().min(0),
    selectedKey: z.string().max(1),
    timeMs: z.number().int().min(0).max(300_000),
  })),
  deviceFingerprint: z.string().min(8).max(256),
})

interface SubmitResult {
  passed: boolean
  scorePercent: number
  correctCount: number
  totalQuestions: number
  badgeId?: string
  verificationUrl?: string
  message: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<SubmitResult>>> {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorised', code: 'UNAUTHORISED' }, { status: 401 })

    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request', code: 'VALIDATION_ERROR' }, { status: 400 })

    const { sessionId, token, answers, deviceFingerprint } = parsed.data

    // Validate session
    const { data: session } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('session_token', token)
      .eq('status', 'in_progress')
      .single<{
        id: string
        student_id: string
        section_id: string
        token_expires_at: string
        questions_total: number
        device_fingerprint: string
        anomaly_score: number
      }>()

    if (!session) return NextResponse.json({ success: false, error: 'Invalid session', code: 'INVALID_SESSION' }, { status: 403 })
    if (new Date(session.token_expires_at) < new Date()) {
      await supabase.from('assessment_sessions').update({ status: 'expired' }).eq('id', sessionId)
      return NextResponse.json({ success: false, error: 'Session expired', code: 'SESSION_EXPIRED' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single<{ id: string }>()

    if (!profile || profile.id !== session.student_id) {
      return NextResponse.json({ success: false, error: 'Unauthorised', code: 'UNAUTHORISED' }, { status: 401 })
    }

    // Fetch questions (same deterministic order as question route)
    const { data: questions } = await supabase
      .from('assessment_questions')
      .select('id, correct_answer, question_type, options')
      .eq('section_id', session.section_id)
      .eq('is_active', true)
      .order('difficulty')
      .limit(session.questions_total * 3)

    if (!questions?.length) return NextResponse.json({ success: false, error: 'Questions unavailable', code: 'NO_QUESTIONS' }, { status: 503 })

    // Rebuild same shuffle as question route
    const seed = session.id.replace(/-/g, '').slice(0, 8)
    const seedNum = parseInt(seed, 16)
    const shuffled = [...questions].sort((a, b) => {
      const hashA = parseInt((a.id + seed).slice(0, 8), 16)
      const hashB = parseInt((b.id + seed).slice(0, 8), 16)
      return (hashA % 1000 + seedNum) - (hashB % 1000 + seedNum)
    })

    // Score each answer
    let correct = 0
    const timings: number[] = []

    for (const answer of answers) {
      const question = shuffled[answer.questionIndex]
      if (!question) continue

      timings.push(answer.timeMs)
      const isCorrect = answer.selectedKey === question.correct_answer
      if (isCorrect) correct++

      // Store response
      await supabase.from('assessment_responses').insert({
        session_id: sessionId,
        question_id: question.id,
        student_answer: answer.selectedKey,
        is_correct: isCorrect,
        time_taken_ms: answer.timeMs,
      })
    }

    const totalQuestions = Math.min(answers.length, session.questions_total)
    const scorePercent = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0
    const passed = scorePercent >= ASSESSMENT.PASS_THRESHOLD_PERCENT

    // Anomaly scoring
    const fingerprintChanged = deviceFingerprint !== session.device_fingerprint
    const answersBeforeRender = answers.filter(a => a.timeMs < 500).length
    const anomaly = calculateAnomalyScore({
      timePerQuestionMs: timings,
      ipChangedDuringSession: false,
      deviceFingerprintChanged: fingerprintChanged,
      answersBeforeRender,
    })

    const totalAnomaly = Math.min(100, session.anomaly_score + anomaly)
    const flagged = totalAnomaly > ASSESSMENT.ANOMALY_SCORE_THRESHOLD

    const completedStatus = passed ? 'completed_pass' : (flagged ? 'flagged' : 'completed_fail')

    // Update session
    await supabase.from('assessment_sessions').update({
      status: completedStatus,
      questions_answered: totalQuestions,
      questions_correct: correct,
      score_percentage: scorePercent,
      time_per_question_ms: timings,
      anomaly_score: totalAnomaly,
      flagged,
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId)

    // Update progress
    const { data: existingProgress } = await supabase
      .from('student_section_progress')
      .select('assessment_attempts, assessment_best_score, status')
      .eq('student_id', profile.id)
      .eq('section_id', session.section_id)
      .single<{ assessment_attempts: number; assessment_best_score: number | null; status: string }>()

    const newAttempts = (existingProgress?.assessment_attempts ?? 0) + 1
    const prevBest = existingProgress?.assessment_best_score ?? 0
    const newBest = Math.max(prevBest, scorePercent)

    await supabase.from('student_section_progress').upsert({
      student_id: profile.id,
      section_id: session.section_id,
      status: passed ? 'passed' : 'in_progress',
      assessment_attempts: newAttempts,
      assessment_best_score: newBest,
      passed_at: passed ? new Date().toISOString() : null,
      last_activity_at: new Date().toISOString(),
    }, { onConflict: 'student_id,section_id' })

    // Fail flag management
    if (!passed) {
      await supabase.from('section_fail_flags').upsert({
        student_id: profile.id,
        section_id: session.section_id,
        fail_count: newAttempts,
        last_fail_at: new Date().toISOString(),
        tutor_prompt_sent: false,
      }, { onConflict: 'student_id,section_id' })
    } else {
      await supabase.from('section_fail_flags')
        .update({ resolved: true, resolved_via: 'self' })
        .eq('student_id', profile.id)
        .eq('section_id', session.section_id)
    }

    // On pass: unlock next section and update student totals
    if (passed) {
      // Unlock the next section in this subject (uses DB function from migration 008)
      await supabase.rpc('unlock_next_section', {
        p_student_id: profile.id,
        p_section_id: session.section_id,
      })

      // Increment total pass count on student profile
      await supabase.rpc('increment_pass_count', {
        p_student_id: profile.id,
      })
    }

    // Issue badge on pass (even flagged sessions get a badge — human review happens in background)
    let badgeId: string | undefined
    let verificationUrl: string | undefined

    if (passed) {
      const now = new Date()
      const badgeInsert = {
        student_id: profile.id,
        section_id: session.section_id,
        assessment_session_id: sessionId,
        rarity: calculateBadgeRarity({
          scorePercent,
          attemptNumber: newAttempts,
          durationSeconds: timings.reduce((a, b) => a + b, 0) / 1000,
          estimatedDurationSeconds: 20 * 60,
          currentStreak: 0,
        }),
        score_percentage: scorePercent,
        issued_at: now.toISOString(),
        signature: 'pending',
        verification_url: 'pending',
        is_revoked: false,
      }

      const { data: badge } = await supabase
        .from('badges')
        .insert(badgeInsert)
        .select('id')
        .single<{ id: string }>()

      if (badge) {
        // Sign the badge
        const sig = signBadge({
          badgeId: badge.id,
          studentId: profile.id,
          sectionId: session.section_id,
          issuedAt: now,
        })
        const url = getBadgeVerificationUrl(badge.id)

        await supabase.from('badges').update({ signature: sig, verification_url: url }).eq('id', badge.id)

        // Update student badge count
        await supabase.rpc('increment_badge_count', { student_id: profile.id })

        // Log to audit
        const adminClient = createAdminClient()
        await adminClient.from('compliance_audit_log').insert({
          actor_id: profile.id,
          actor_role: 'system',
          action: 'badge.issued',
          table_name: 'badges',
          record_id: badge.id,
          after_data: { student_id: profile.id, section_id: session.section_id, score: scorePercent },
        })

        badgeId = badge.id
        verificationUrl = url
      }
    }

    const message = passed
      ? `Excellent work! You scored ${scorePercent.toFixed(0)}% and passed this section.`
      : `You scored ${scorePercent.toFixed(0)}%. You need ${ASSESSMENT.PASS_THRESHOLD_PERCENT}% to pass. Keep going — you can retry in 24 hours.`

    return NextResponse.json({
      success: true,
      data: {
        passed,
        scorePercent,
        correctCount: correct,
        totalQuestions,
        badgeId,
        verificationUrl,
        message,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
