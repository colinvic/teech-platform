import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const reviewSchema = z.object({ sessionId: z.string().uuid(), rating: z.number().int().min(1).max(5), comment: z.string().max(1000).optional() })

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    const parsed = reviewSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    const { sessionId, rating, comment } = parsed.data
    const { data: session } = await supabase.from('tutor_sessions').select('id,tutor_id,student_id,status').eq('id', sessionId).eq('parent_id', user.id).single()
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    if (session.status !== 'completed') return NextResponse.json({ success: false, error: 'Session not completed' }, { status: 400 })
    const { data: review, error: insertError } = await supabase.from('tutor_reviews').insert({ session_id: sessionId, tutor_id: session.tutor_id, student_id: session.student_id, parent_id: user.id, rating, comment: comment ?? null, status: 'pending_moderation' }).select('id').single()
    if (insertError) return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 })
    return NextResponse.json({ success: true, data: { reviewId: review.id } })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
