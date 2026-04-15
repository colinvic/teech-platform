// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types/platform'

const sessionSchema = z.object({
  tutorId:          z.string().uuid(),
  studentId:        z.string().uuid(),
  scheduledAt:      z.string().datetime({ offset: true }),
  durationMinutes:  z.number().int().refine((v) => [30, 45, 60, 90].includes(v), 'Invalid duration'),
  sectionId:        z.string().uuid().optional(),
})

const PLATFORM_FEE_RATE = 0.15
const GST_RATE           = 0.10

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ sessionId: string }>>> {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorised', code: 'UNAUTHORISED' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'parent') return NextResponse.json({ success: false, error: 'Only parents can book', code: 'UNAUTHORISED' }, { status: 401 })
    const parsed = sessionSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message, code: 'VALIDATION_ERROR' }, { status: 400 })
    const { tutorId, studentId, scheduledAt, durationMinutes, sectionId } = parsed.data
    const { data: tutorProfile } = await supabase.from('tutor_profiles').select('hourly_rate_cents,status,stripe_onboarding_complete').eq('profile_id', tutorId).single()
    if (!tutorProfile || tutorProfile.status !== 'active') return NextResponse.json({ success: false, error: 'Tutor not available', code: 'NOT_FOUND' }, { status: 404 })
    const multiplier = durationMinutes / 60
    const amountCents = Math.round((tutorProfile.hourly_rate_cents as number) * multiplier)
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE)
    const gstCents = Math.round(amountCents * GST_RATE)
    const { data: session, error: insertError } = await supabase.from('tutor_sessions').insert({ tutor_id: tutorId, student_id: studentId, parent_id: user.id, section_id: sectionId ?? null, status: 'pending_payment', scheduled_at: scheduledAt, duration_minutes: durationMinutes, amount_cents: amountCents, platform_fee_cents: platformFeeCents, gst_cents: gstCents }).select('id').single()
    if (insertError) return NextResponse.json({ success: false, error: 'Failed to create session', code: 'INTERNAL_ERROR' }, { status: 500 })
    return NextResponse.json({ success: true, data: { sessionId: session.id } })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
