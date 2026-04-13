import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

async function verifyAdmin(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single<{ id: string; role: string }>()

  if (profile?.role !== 'admin') return null
  return { user, profile }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request)
  if (!admin) return NextResponse.redirect(new URL('/login', request.url))

  const body = await request.formData()
  const questionId = body.get('questionId') as string
  if (!questionId) return NextResponse.redirect(new URL('/admin/dashboard', request.url))

  const adminClient = createAdminClient()

  await adminClient
    .from('assessment_questions')
    .update({ reviewed_by_human: true, is_active: true })
    .eq('id', questionId)

  await adminClient.from('compliance_audit_log').insert({
    actor_id: admin.profile.id,
    actor_role: 'admin',
    action: 'question.approved',
    table_name: 'assessment_questions',
    record_id: questionId,
  })

  return NextResponse.redirect(new URL('/admin/dashboard', request.url))
}
