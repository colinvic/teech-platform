import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'

const schema = z.object({
  tutorSessionId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })

    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })

    const { tutorSessionId } = parsed.data

    const { data: session } = await supabase
      .from('tutor_sessions')
      .select(`
        id, amount_total, section:curriculum_sections(name),
        tutor:profiles!tutor_id(preferred_name)
      `)
      .eq('id', tutorSessionId)
      .eq('status', 'pending')
      .single()

    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })

    const typedSession = session as {
      id: string
      amount_total: number
      section: { name: string } | null
      tutor: { preferred_name: string | null } | null
    }

    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://teech.au'
    const checkout = await createCheckoutSession({
      tutorSessionId,
      parentStripeCustomerId: null,
      amountCents: typedSession.amount_total,
      sessionTitle: `${typedSession.section?.name ?? 'Tutoring'} — 30 min session`,
      tutorName: typedSession.tutor?.preferred_name ?? 'your tutor',
      successUrl: `${baseUrl}/parent/dashboard?booking=success`,
      cancelUrl: `${baseUrl}/parent/dashboard?booking=cancelled`,
    })

    return NextResponse.json({ success: true, data: { url: checkout.url } })
  } catch (err) {
    logger.error('stripe-checkout', 'Checkout session creation failed', { error: String(err) })
    return NextResponse.json({ success: false, error: 'Checkout failed' }, { status: 500 })
  }
}
