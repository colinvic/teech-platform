// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { ASSESSMENT } from '@/lib/constants'
import type { ApiResponse } from '@/types/platform'

const schema = z.object({
  sessionId: z.string().uuid(),
  token: z.string().min(32).max(128),
  questionIndex: z.number().int().min(0).max(20),
})

// What the client receives Ã¢ÂÂ question ID is never exposed
interface ClientQuestion {
  index: number
  questionText: string
  questionType: string
  options: Array<{ key: string; text: string }> | null
  totalQuestions: number
  timeRemainingSeconds: number
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ClientQuestion>>> {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorised', code: 'UNAUTHORISED' }, { status: 401 })

    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request', code: 'VALIDATION_ERROR' }, { status: 400 })

    const { sessionId, token, questionIndex } = parsed.data

    // Validate session + token
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
      }>()

    if (!session) return NextResponse.json({ success: false, error: 'Invalid or expired session', code: 'INVALID_SESSION' }, { status: 403 })

    // Token expiry check
    if (new Date(session.token_expires_at) < new Date()) {
      await supabase.from('assessment_sessions').update({ status: 'expired' }).eq('id', sessionId)
      return NextResponse.json({ success: false, error: 'Session expired', code: 'SESSION_EXPIRED' }, { status: 403 })
    }

    // Verify this is the session owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single<{ id: string }>()

    if (!profile || profile.id !== session.student_id) {
      return NextResponse.json({ success: false, error: 'Unauthorised', code: 'UNAUTHORISED' }, { status: 401 })
    }

    // Detect device fingerprint change mid-session
    const currentFingerprint = request.headers.get('x-device-fingerprint') ?? ''
    const fingerprintChanged = currentFingerprint !== '' && currentFingerprint !== session.device_fingerprint

    if (fingerprintChanged) {
      // Increment anomaly score
      await supabase.rpc('increment_anomaly_score', { session_id: sessionId, increment: 30 })
    }

    // Fetch active questions for this section Ã¢ÂÂ ordered deterministically per session
    // Use session ID as a seed for consistent ordering within the session
    const { data: questions } = await supabase
      .from('assessment_questions')
      .select('id, question_type, question_text, options, difficulty')
      .eq('section_id', session.section_id)
      .eq('is_active', true)
      .order('difficulty')
      .limit(session.questions_total * 3)  // fetch 3x pool, select randomly server-side

    if (!questions?.length) {
      return NextResponse.json({ success: false, error: 'No questions available', code: 'NO_QUESTIONS' }, { status: 503 })
    }

    // Deterministic shuffle using session ID as seed (same questions for same session)
    const seed = session.id.replace(/-/g, '').slice(0, 8)
    const seedNum = parseInt(seed, 16)
    const shuffled = [...questions].sort((a, b) => {
      const hashA = parseInt((a.id + seed).slice(0, 8), 16)
      const hashB = parseInt((b.id + seed).slice(0, 8), 16)
      return (hashA % 1000 + seedNum) - (hashB % 1000 + seedNum)
    })

    const question = shuffled[questionIndex]
    if (!question) {
      return NextResponse.json({ success: false, error: 'Question index out of range', code: 'OUT_OF_RANGE' }, { status: 400 })
    }

    // Shuffle options for this specific delivery (anti-pattern-memorisation)
    let shuffledOptions: Array<{ key: string; text: string }> | null = null
    if (question.options) {
      const opts = [...(question.options as Array<{ key: string; text: string }>)]
      // Consistent shuffle per question+session
      const optSeed = parseInt((question.id + session.id).slice(0, 6), 16)
      opts.sort((a, b) => (a.key.charCodeAt(0) * optSeed) % 4 - (b.key.charCodeAt(0) * optSeed) % 4)
      shuffledOptions = opts
    }

    const timeRemaining = Math.max(0,
      Math.floor((new Date(session.token_expires_at).getTime() - Date.now()) / 1000)
    )

    // NOTE: question.id is NOT returned to the client Ã¢ÂÂ submitted answers use index
    const clientQuestion: ClientQuestion = {
      index: questionIndex,
      questionText: question.question_text,
      questionType: question.question_type,
      options: shuffledOptions,
      totalQuestions: session.questions_total,
      timeRemainingSeconds: timeRemaining,
    }

    return NextResponse.json({ success: true, data: clientQuestion })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
