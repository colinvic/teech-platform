import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
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

  // Find reviews that:
  // 1. Have been moderated (approved)
  // 2. Are not yet published
  // 3. Are older than the moderation hold period (24 hours)
  const holdCutoff = new Date(now)
  holdCutoff.setHours(holdCutoff.getHours() - MARKETPLACE.REVIEW_MODERATION_HOURS)

  const { data: readyToPublish } = await supabase
    .from('session_reviews')
    .select('id, session_id, reviewer_type, rating')
    .eq('moderated', true)
    .eq('published', false)
    .lte('created_at', holdCutoff.toISOString())

  if (!readyToPublish?.length) {
    return NextResponse.json({ published: 0, timestamp: now.toISOString() })
  }

  // Publish in batch
  const ids = readyToPublish.map(r => (r as { id: string }).id)

  const { error } = await supabase
    .from('session_reviews')
    .update({ published: true })
    .in('id', ids)

  if (error) {
    logger.error('publish-reviews-cron', 'Batch publish failed', { error: String(error) })
    return NextResponse.json({ error: 'Publish failed' }, { status: 500 })
  }

  // Update tutor ratings for affected sessions
  const sessionIds = [...new Set(readyToPublish.map(r => (r as { session_id: string }).session_id))]

  for (const sessionId of sessionIds) {
    // Get tutor ID for this session
    const { data: session } = await supabase
      .from('tutor_sessions')
      .select('tutor_id')
      .eq('id', sessionId)
      .single<{ tutor_id: string }>()

    if (!session) continue

    // Recalculate tutor average rating from all published reviews
    const { data: reviews } = await supabase
      .from('session_reviews')
      .select('rating, session:tutor_sessions!session_id(tutor_id)')
      .eq('published', true)

    const tutorReviews = (reviews ?? []).filter(r => {
      const sess = r.session as { tutor_id: string } | null
      return sess?.tutor_id === session.tutor_id
    })

    if (tutorReviews.length > 0) {
      const avg = tutorReviews.reduce((sum, r) => sum + (r.rating as number), 0) / tutorReviews.length
      await supabase
        .from('tutor_profiles')
        .update({ rating: Math.round(avg * 10) / 10 })
        .eq('id', session.tutor_id)
    }
  }

  await supabase.from('compliance_audit_log').insert({
    actor_id: null,
    actor_role: 'system',
    action: 'reviews.batch_published',
    after_data: { count: ids.length, timestamp: now.toISOString() },
  })

  return NextResponse.json({
    published: ids.length,
    timestamp: now.toISOString(),
  })
}
