/**
 * teech-platform — Stripe Client
 *
 * Handles: session payments, Stripe Connect tutor payouts, GST.
 * All amounts in AUD cents.
 * GST (10%) is included in all session prices.
 * Platform commission: 20%. Tutor payout: 80%.
 */

import Stripe from 'stripe'
import { calculateSplit, currentTaxYear, currentFinancialYear } from './utils'
import { MARKETPLACE, PLATFORM } from './constants'

if (!process.env['STRIPE_SECRET_KEY']) {
  throw new Error('[teech] Missing STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2024-04-10',
  typescript: true,
  appInfo: {
    name: 'teech.au',
    version: process.env['NEXT_PUBLIC_PLATFORM_VERSION'] ?? '0.1.0',
    url: 'https://teech.au',
  },
})

// ── Checkout session ──────────────────────────────────────────────────────────

export interface CreateCheckoutParams {
  tutorSessionId: string
  parentStripeCustomerId: string | null
  amountCents: number              // GST-inclusive total
  sessionTitle: string             // e.g. "Cell Biology — 30 min session"
  tutorName: string                // display only — no PII beyond name
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const { gst, excGST } = calculateSplit(params.amountCents)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: params.parentStripeCustomerId ?? undefined,
    customer_creation: params.parentStripeCustomerId ? undefined : 'always',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'aud',
          unit_amount: params.amountCents,
          product_data: {
            name: params.sessionTitle,
            description: `Tutoring session with ${params.tutorName} — includes GST`,
            metadata: {
              platform: PLATFORM.NAME,
              tutor_session_id: params.tutorSessionId,
            },
          },
        },
      },
    ],
    metadata: {
      tutor_session_id: params.tutorSessionId,
      amount_gst: String(gst),
      amount_exc_gst: String(excGST),
      platform_fee: String(Math.round(params.amountCents * MARKETPLACE.PLATFORM_COMMISSION_PERCENT / 100)),
    },
    payment_intent_data: {
      description: params.sessionTitle,
      metadata: {
        tutor_session_id: params.tutorSessionId,
      },
    },
    // Show GST breakdown at checkout
    tax_id_collection: { enabled: false },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    // Cancellation policy displayed
    consent_collection: {
      terms_of_service: 'required',
    },
    custom_text: {
      terms_of_service_acceptance: {
        message: `By booking, you agree to teech.au's [booking terms](${process.env['NEXT_PUBLIC_APP_URL']}/terms/booking). Sessions are refundable if cancelled 48+ hours before.`,
      },
    },
  })

  return session
}

// ── Tutor Connect account ─────────────────────────────────────────────────────

export async function createConnectAccount(params: {
  email: string
  tutorProfileId: string
}) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'AU',
    email: params.email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      platform: PLATFORM.NAME,
      tutor_profile_id: params.tutorProfileId,
    },
    settings: {
      payouts: {
        schedule: {
          interval: 'weekly',
          weekly_anchor: 'friday',
        },
      },
    },
  })

  return account
}

export async function createConnectOnboardingLink(params: {
  stripeAccountId: string
  returnUrl: string
  refreshUrl: string
}) {
  const link = await stripe.accountLinks.create({
    account: params.stripeAccountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: 'account_onboarding',
  })

  return link
}

// ── Tutor payout ──────────────────────────────────────────────────────────────

export interface ProcessPayoutParams {
  tutorStripeAccountId: string
  amountCents: number              // full session amount (GST-inclusive)
  tutorSessionId: string
  tutorProfileId: string
}

export async function processTutorPayout(params: ProcessPayoutParams) {
  const { tutorPayout, platformFee, gst } = calculateSplit(params.amountCents)

  // Transfer tutor's share to their Connect account
  const transfer = await stripe.transfers.create({
    amount: tutorPayout,
    currency: 'aud',
    destination: params.tutorStripeAccountId,
    description: `teech.au session payout — ${params.tutorSessionId}`,
    metadata: {
      tutor_session_id: params.tutorSessionId,
      tutor_profile_id: params.tutorProfileId,
      gross_amount: String(params.amountCents),
      platform_fee: String(platformFee),
      gst_component: String(gst),
      tax_year: String(currentTaxYear()),
      financial_year: currentFinancialYear(),
    },
  })

  return {
    transfer,
    breakdown: {
      grossAmount: params.amountCents,
      gstComponent: gst,
      platformFee,
      tutorPayout,
      taxYear: currentTaxYear(),
      financialYear: currentFinancialYear(),
    },
  }
}

// ── Refund ────────────────────────────────────────────────────────────────────

export type RefundReason =
  | 'cancelled_by_parent_48h'   // full refund
  | 'cancelled_by_parent_24h'   // 50% refund
  | 'cancelled_by_tutor'        // full refund
  | 'technical_failure'         // full refund
  | 'dispute_resolved_parent'   // full refund

export async function processRefund(params: {
  paymentIntentId: string
  reason: RefundReason
  tutorSessionId: string
}) {
  const isFullRefund = [
    'cancelled_by_parent_48h',
    'cancelled_by_tutor',
    'technical_failure',
    'dispute_resolved_parent',
  ].includes(params.reason)

  // For partial refunds, retrieve the payment intent to get the amount
  const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId)
  const originalAmount = paymentIntent.amount

  const refundAmount = isFullRefund
    ? originalAmount
    : Math.round(originalAmount * (MARKETPLACE.PARTIAL_REFUND_PERCENT / 100))

  const refund = await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: refundAmount,
    reason: 'requested_by_customer',
    metadata: {
      refund_reason: params.reason,
      tutor_session_id: params.tutorSessionId,
      is_full_refund: String(isFullRefund),
    },
  })

  return { refund, refundAmount, isFullRefund }
}

// ── Webhook verification ──────────────────────────────────────────────────────

export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']
  if (!webhookSecret) {
    throw new Error('[teech] Missing STRIPE_WEBHOOK_SECRET')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
