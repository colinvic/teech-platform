// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { sendWWCExpiryAlert } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase'
import { MARKETPLACE } from '@/lib/constants'

function verifyCronSecret(request: NextRequest) {
  return request.headers.get('authorization') === `Bearer ${process.env['CRON_SECRET']}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  // Find tutors whose WWC check expires within the alert window
  const alertCutoff = new Date(now)
  alertCutoff.setDate(alertCutoff.getDate() + MARKETPLACE.WWC_RENEWAL_ALERT_DAYS)

  const { data: expiring } = await supabase
    .from('wwc_verifications')
    .select(`
      id, tutor_id, state, wwc_number, expiry_date, next_check_due,
      tutor:profiles!tutor_id(full_name, user_id)
    `)
    .lte('expiry_date', alertCutoff.toISOString().split('T')[0])
    .gte('expiry_date', now.toISOString().split('T')[0])

  // Find already-expired checks Ã¢ÂÂ these are critical: suspend tutor immediately
  const { data: expired } = await supabase
    .from('wwc_verifications')
    .select('tutor_id, state, wwc_number, expiry_date')
    .lt('expiry_date', now.toISOString().split('T')[0])

  let alerted = 0
  let suspended = 0

  // Handle expired Ã¢ÂÂ suspend tutor profile
  for (const wwc of expired ?? []) {
    const typedWwc = wwc as { tutor_id: string; state: string; wwc_number: string; expiry_date: string }

    await supabase
      .from('tutor_profiles')
      .update({ status: 'suspended' })
      .eq('id', typedWwc.tutor_id)
      .eq('status', 'active')

    await supabase.from('compliance_audit_log').insert({
      actor_id: null,
      actor_role: 'system',
      action: 'tutor.suspended.wwc_expired',
      table_name: 'tutor_profiles',
      record_id: typedWwc.tutor_id,
      after_data: {
        state: typedWwc.state,
        wwc_number: typedWwc.wwc_number,
        expired: typedWwc.expiry_date,
      },
    })

    logger.critical('wwc-cron', 'Tutor suspended Ã¢ÂÂ WWC expired', { tutorId: typedWwc.tutor_id, state: typedWwc.state, expiredDate: typedWwc.expiry_date })
    suspended++
  }

  // Handle expiring soon Ã¢ÂÂ send renewal alert
  for (const wwc of expiring ?? []) {
    const typedWwc = wwc as {
      id: string
      tutor_id: string
      state: string
      expiry_date: string
      tutor: { full_name: string | null; user_id: string } | null
    }

    const daysUntilExpiry = Math.floor(
      (new Date(typedWwc.expiry_date).getTime() - now.getTime()) / 86400000
    )

    // Get tutor email and send alert
    const { data: tutorUser } = await supabase.auth.admin.getUserById(
      (await supabase.from('profiles').select('user_id').eq('id', typedWwc.tutor_id).single<{ user_id: string }>()).data?.user_id ?? ''
    )
    if (tutorUser?.user?.email) {
      await sendWWCExpiryAlert({
        tutorEmail:      tutorUser.user.email,
        tutorName:       typedWwc.tutor?.full_name ?? 'Tutor',
        state:           typedWwc.state,
        expiryDate:      typedWwc.expiry_date,
        daysUntilExpiry,
      })
    }
    logger.warn('wwc-cron', 'WWC expiry alert sent', { tutorId: typedWwc.tutor_id, state: typedWwc.state, daysUntilExpiry })

    await supabase.from('compliance_audit_log').insert({
      actor_id: null,
      actor_role: 'system',
      action: 'tutor.wwc_expiry_alert',
      table_name: 'wwc_verifications',
      record_id: typedWwc.id,
      after_data: { days_until_expiry: daysUntilExpiry, state: typedWwc.state },
    })

    alerted++
  }

  return NextResponse.json({
    alerted,
    suspended,
    timestamp: now.toISOString(),
  })
}
