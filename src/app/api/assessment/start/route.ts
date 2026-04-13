import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { ASSESSMENT } from '@/lib/constants'
import type { ApiResponse } from '@/types/platform'

const schema = z.object({
  sectionId: z.string().uuid(),
  deviceFingerprint: z.string().min(8).max(256),
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ sessionId: string; token: string; expiresAt: string }>>> {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorised', code: 'UNAUTHORISED' }, { status: 401 })

    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request', code: 'VALIDATION_ERROR' }, { status: 400 })

    const { sectionId, deviceFingerprint } = parsed.data

    // Get student profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single<{ id: string }>()

    if (!profile) return NextResponse.json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' }, { status: 404 })

    // Check progress record for cooldown + max attempts
    const { data: progress } = await supabase
      .from('student_section_progress')
      .select('assessment_attempts, last_activity_at')
      .eq('student_id', profile.id)
      .eq('section_id', sectionId)
      .single<{ assessment_attempts: number; last_activity_at: string | null }>()

    if (progress) {
      // Max attempts check
      if (progress.assessment_attempts >= ASSESSMENT.MAX_ATTEMPTS_BEFORE_PARENT_NOTIFY) {
        // Still allow — but a notification will be triggered separately
      }

      // Cooldown check: 24 hours after last activity
      if (progress.last_activity_at) {
        const lastActivity = new Date(progress.last_activity_at)
        const hoursSince = (Date.now() - lastActivity.getTime()) / 1000 / 3600
        if (hoursSince < ASSESSMENT.COOLDOWN_HOURS_AFTER_FAIL) {
          const hoursRemaining = Math.ceil(ASSESSMENT.COOLDOWN_HOURS_AFTER_FAIL - hoursSince)
          return NextResponse.json({
            success: false,
            error: `Please wait ${hoursRemaining} more hour${hoursRemaining !== 1 ? 's' : ''} before retrying.`,
            code: 'COOLDOWN_ACTIVE',
          }, { status: 429 })
        }
      }
    }

    // Create session
    const expiresAt = new Date(Date.now() + ASSESSMENT.SESSION_EXPIRY_MINUTES * 60 * 1000)
    const ipAddress = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '0.0.0.0'
    const userAgent = request.headers.get('user-agent') ?? 'unknown'

    const { data: session, error: sessionError } = await supabase
      .from('assessment_sessions')
      .insert({
        student_id: profile.id,
        section_id: sectionId,
        token_expires_at: expiresAt.toISOString(),
        status: 'in_progress',
        device_fingerprint: deviceFingerprint,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id, session_token, token_expires_at')
      .single<{ id: string; session_token: string; token_expires_at: string }>()

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: 'Failed to start session', code: 'SESSION_ERROR' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        token: session.session_token,
        expiresAt: session.token_expires_at,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
