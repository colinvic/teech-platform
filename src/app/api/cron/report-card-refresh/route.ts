// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

function verifyCronSecret(request: NextRequest) {
  return request.headers.get('authorization') === `Bearer ${process.env['CRON_SECRET']}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: students } = await supabase
    .from('student_profiles')
    .select('id')

  if (!students?.length) return NextResponse.json({ refreshed: 0 })

  let refreshed = 0
  for (const student of students) {
    await supabase.rpc('refresh_report_card_cache', { p_student_id: student.id })
    refreshed++
  }

  return NextResponse.json({ refreshed, timestamp: new Date().toISOString() })
}
