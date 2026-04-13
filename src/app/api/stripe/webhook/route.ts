import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { verifyWebhookSignature, processTutorPayout } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = verifyWebhookSignature(body, signature)
  } catch (err) {
    logger.error('stripe-webhook', 'Signature verification failed', { error: String(err) })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const tutorSessionId = session.metadata?.['tutor_session_id']
        if (!tutorSessionId) break

        // Mark session as confirmed + store payment intent
        await supabase
          .from('tutor_sessions')
          .update({
            status: 'confirmed',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', tutorSessionId)

        // Audit log
        await supabase.from('compliance_audit_log').insert({
          actor_id: null,
          actor_role: 'system',
          action: 'payment.confirmed',
          table_name: 'tutor_sessions',
          record_id: tutorSessionId,
          after_data: { payment_intent: session.payment_intent, amount: session.amount_total },
        })
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const tutorSessionId = intent.metadata?.['tutor_session_id']
        if (!tutorSessionId) break

        await supabase
          .from('tutor_sessions')
          .update({ status: 'cancelled_parent' })
          .eq('id', tutorSessionId)
          .eq('status', 'pending')
        break
      }

      case 'account.updated': {
        // Stripe Connect account verified — activate tutor if all checks pass
        const account = event.data.object as Stripe.Account
        if (account.charges_enabled && account.payouts_enabled) {
          await supabase
            .from('tutor_profiles')
            .update({ stripe_account_id: account.id })
            .eq('stripe_account_id', account.id)
        }
        break
      }

      default:
        // Unhandled event types — log and ignore
        logger.info('stripe-webhook', 'Unhandled event type — ignoring', { eventType: event.type })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error('stripe-webhook', 'Event processing failed', { error: String(err) })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

// Stripe requires raw body — disable Next.js body parsing
export const config = {
  api: { bodyParser: false },
}
