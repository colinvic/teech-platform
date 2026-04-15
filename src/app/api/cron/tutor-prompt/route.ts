// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { sendTutorPrompt } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase'

function verifyCronSecret(request: NextRequest) {
  return request.headers.get('authorization') === `Bearer ${process.env['CRON_SECRET']}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all students needing a tutor prompt
  const { data: flagged } = await supabase.rpc('get_students_needing_tutor_prompt')

  if (!flagged?.length) return NextResponse.json({ prompted: 0 })

  let prompted = 0
  for (const flag of flagged as Array<{
    student_id: string
    section_id: string
    fail_count: number
    parent_id: string | null
    student_name: string
    section_name: string
  }>) {
    if (!flag.parent_id) continue

    // Get parent email
    const { data: parentAuth } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', flag.parent_id)
      .single<{ user_id: string }>()

    if (parentAuth) {
      // Get parent email from auth.users
      const { data: parentUser } = await supabase.auth.admin.getUserById(parentAuth.user_id)
      if (parentUser?.user?.email) {
        await sendTutorPrompt({
          parentEmail:  parentUser.user.email,
          studentName:  flag.student_name ?? 'Your student',
          sectionName:  flag.section_name ?? 'a curriculum section',
          failCount:    flag.fail_count,
        })
        logger.info('tutor-prompt-cron', 'Tutor prompt email sent', {
          studentName: flag.student_name,
          sectionName: flag.section_name,
          failCount:   flag.fail_count,
        })
      }
    }

    // Mark as prompted regardless â avoid repeat notifications
    await supabase
      .from('section_fail_flags')
      .update({
        tutor_prompt_sent: true,
        tutor_prompt_sent_at: new Date().toISOString(),
      })
      .eq('student_id', flag.student_id)
      .eq('section_id', flag.section_id)

    // Audit log
    await supabase.from('compliance_audit_log').insert({
      actor_id: null,
      actor_role: 'system',
      action: 'tutor_prompt.sent',
      table_name: 'section_fail_flags',
      after_data: {
        student_id: flag.student_id,
        section_id: flag.section_id,
        fail_count: flag.fail_count,
      },
    })

    prompted++
  }

  return NextResponse.json({ prompted, timestamp: new Date().toISOString() })
}
