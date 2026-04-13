import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Security: Vercel cron jobs send an Authorization header
function verifyCronSecret(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env['CRON_SECRET']}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all active students
  const { data: students } = await supabase
    .from('student_profiles')
    .select('id')
    .not('last_active_at', 'is', null)

  if (!students?.length) return NextResponse.json({ processed: 0 })

  let reset = 0
  for (const student of students) {
    await supabase.rpc('update_student_streak', { p_student_id: student.id })
    reset++
  }

  return NextResponse.json({ processed: reset, timestamp: new Date().toISOString() })
}
