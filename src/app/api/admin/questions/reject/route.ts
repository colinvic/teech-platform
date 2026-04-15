// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single<{ id: string; role: string }>()

  if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/login', request.url))

  const body = await request.formData()
  const questionId = body.get('questionId') as string
  if (!questionId) return NextResponse.redirect(new URL('/admin/dashboard', request.url))

  const adminClient = createAdminClient()

  // Soft delete Ã¢ÂÂ mark reviewed but not active
  await adminClient
    .from('assessment_questions')
    .update({ reviewed_by_human: true, is_active: false })
    .eq('id', questionId)

  await adminClient.from('compliance_audit_log').insert({
    actor_id: profile.id,
    actor_role: 'admin',
    action: 'question.rejected',
    table_name: 'assessment_questions',
    record_id: questionId,
  })

  return NextResponse.redirect(new URL('/admin/dashboard', request.url))
}
