import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export type TutorAdminRow = {
  id: string
  profile_id: string
  status: string
  wwc_verified: boolean
  kyc_verified: boolean
  stripe_onboarding_complete: boolean
  hourly_rate_cents: number | null
  session_count: number
  rating_average: number | null
  wwc_expiry: string | null
  wwc_state: string | null
  wwc_number: string | null
  profiles: { full_name: string; email: string } | null
}

async function requireAdmin(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('tutor_profiles').select('profile_id,status,wwc_number,wwc_state,wwc_expiry,wwc_verified,kyc_verified,stripe_onboarding_complete,bio,subjects,year_levels,hourly_rate_cents,session_count,rating_average,terms_accepted_at,created_at,profiles!inner(full_name,email,created_at)').eq('status', status).order('created_at', { ascending: true })
  if (error) return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  return NextResponse.json({ success: true, data: data ?? [] })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const adminUser = await requireAdmin(req)
  if (!adminUser) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { tutorId, action, note } = body
  const supabase = createAdminClient()
  const updateMap = { approve: { status: 'active' }, reject: { status: 'rejected' }, suspend: { status: 'suspended' }, verify_wwc: { wwc_verified: true }, unverify_wwc: { wwc_verified: false } } as any
  const updates = { ...updateMap[action], updated_at: new Date().toISOString() }
  const { error } = await supabase.from('tutor_profiles').update(updates).eq('profile_id', tutorId)
  if (error) return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  await supabase.from('compliance_audit_log').insert({ actor_id: adminUser.id, actor_role: 'admin', action: `admin.tutor.${action}`, table_name: 'tutor_profiles', record_id: tutorId, metadata: { note, updates } })
  return NextResponse.json({ success: true, data: { done: true } })
}
