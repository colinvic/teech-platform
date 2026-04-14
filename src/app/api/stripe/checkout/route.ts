import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { ApiResponse } from '@/types/platform'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ url: string }>>> {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorised', code: 'UNAUTHORISED' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role,email,full_name').eq('id', user.id).single()
    if (profile?.role !== 'parent') return NextResponse.json({ success: false, error: 'Only parents can book', code: 'UNAUTHORISED' }, { status: 401 })
    const { tutorSessionId } = await req.json()
    if (!tutorSessionId) return NextResponse.json({ success: false, error: 'tutorSessionId required' }, { status: 400 })
    const { data: ts } = await supabase.from('tutor_sessions').select('id,tutor_id,amount_cents,platform_fee_cents,gst_cents,duration_minutes,scheduled_at,status,section_id,stripe_checkout_session_id,tutor_profiles!inner(stripe_account_id,stripe_onboarding_complete),curriculum_sections(name)').eq('id', tutorSessionId).eq('parent_id', user.id).single()
    if (!ts) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (ts.status !== 'pending_payment') return NextResponse.json({ success: false, error: 'Session not available' }, { status: 400 })
    const tp = ts.tutor_profiles as any
    if (!tp.stripe_onboarding_complete || !tp.stripe_account_id) return NextResponse.json({ success: false, error: 'Tutor payment setup incomplete' }, { status: 400 })
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teech.au'
    const total = (ts.amount_cents as number) + (ts.gst_cents as number)
    const checkout = await stripe.checkout.sessions.create({ mode: 'payment', payment_method_types: ['card'], customer_email: profile.email as string, line_items: [{ price_data: { currency: 'aud', unit_amount: total, product_data: { name: 'Tutoring session', metadata: { tutor_session_id: ts.id } } }, quantity: 1 }], payment_intent_data: { application_fee_amount: ts.platform_fee_cents as number, transfer_data: { destination: tp.stripe_account_id }, metadata: { tutor_session_id: ts.id, parent_id: user.id } }, metadata: { tutor_session_id: ts.id }, success_url: `${baseUrl}/parent/dashboard?booking=confirmed&session=${ts.id}`, cancel_url: `${baseUrl}/parent/tutors?booking=cancelled`, expires_at: Math.floor(Date.now()/1000)+1800 })
    await supabase.from('tutor_sessions').update({ stripe_checkout_session_id: checkout.id, updated_at: new Date().toISOString() }).eq('id', ts.id)
    return NextResponse.json({ success: true, data: { url: checkout.url! } })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
