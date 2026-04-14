import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET) }
  catch (err) { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }) }
  const db = createAdminClient()
  logger.info('webhook.received', { type: event.type, id: event.id })
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const { data: ts } = await db.from('tutor_sessions').select('id,tutor_id').eq('stripe_checkout_session_id', s.id).single()
        if (ts) {
          await db.from('tutor_sessions').update({ status: 'confirmed', stripe_payment_intent_id: s.payment_intent as string, updated_at: new Date().toISOString() }).eq('id', ts.id)
          await db.rpc('increment_tutor_session_count', { p_tutor_id: ts.tutor_id })
          await db.from('compliance_audit_log').insert({ action: 'stripe.checkout.completed', table_name: 'tutor_sessions', record_id: ts.id, metadata: { stripe_checkout_session_id: s.id } })
        }
        break
      }
      case 'checkout.session.expired': {
        const s = event.data.object as Stripe.Checkout.Session
        await db.from('tutor_sessions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('stripe_checkout_session_id', s.id).eq('status', 'pending_payment')
        break
      }
      case 'charge.refunded': {
        const c = event.data.object as Stripe.Charge
        if (c.payment_intent) await db.from('tutor_sessions').update({ status: 'refunded', updated_at: new Date().toISOString() }).eq('stripe_payment_intent_id', c.payment_intent as string)
        break
      }
      case 'account.updated': {
        const a = event.data.object as Stripe.Account
        const ok = a.details_submitted && !(a.requirements?.currently_due?.length)
        if (a.id) await db.from('tutor_profiles').update({ stripe_onboarding_complete: ok, updated_at: new Date().toISOString() }).eq('stripe_account_id', a.id)
        break
      }
      case 'transfer.created': {
        const t = event.data.object as Stripe.Transfer
        await db.from('tutor_payouts').update({ status: 'paid', processed_at: new Date().toISOString() }).eq('stripe_transfer_id', t.id)
        break
      }
      case 'identity.verification_session.verified': {
        const vs = event.data.object as Stripe.Identity.VerificationSession
        const tutorId = vs.metadata?.tutor_id
        if (tutorId) {
          await db.from('tutor_profiles').update({ kyc_verified: true, stripe_identity_session_id: vs.id, updated_at: new Date().toISOString() }).eq('profile_id', tutorId)
          await db.from('compliance_audit_log').insert({ actor_id: tutorId, actor_role: 'tutor', action: 'stripe.identity.verified', table_name: 'tutor_profiles', metadata: { stripe_identity_session_id: vs.id } })
        }
        break
      }
      default: logger.info('stripe.webhook.unhandled', { type: event.type })
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    return NextResponse.json({ received: true, warning: 'Handler exception' })
  }
}
