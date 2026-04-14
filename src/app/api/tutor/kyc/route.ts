import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).single()
    if (profile?.role !== 'tutor') return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://teech.au'
    const session = await stripe.identity.verificationSessions.create({ type: 'document', options: { document: { allowed_types: ['driving_license', 'passport'], require_id_number: true, require_live_capture: true, require_matching_selfie: true } }, metadata: { tutor_id: user.id, tutor_name: (profile?.full_name as string) ?? '' }, return_url: `${baseUrl}/tutor/onboarding?step=connect&kyc=complete` })
    await supabase.from('tutor_profiles').update({ updated_at: new Date().toISOString() }).eq('profile_id', user.id)
    return NextResponse.json({ success: true, data: { url: session.url! } })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
