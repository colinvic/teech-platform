import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject')
    const yearLevel = searchParams.get('yearLevel')
    let query = supabase.from('tutor_profiles').select('profile_id,bio,subjects,year_levels,hourly_rate_cents,rating_average,rating_count,session_count,pass_rate,profiles!inner(full_name)').eq('status', 'active').eq('wwc_verified', true).eq('stripe_onboarding_complete', true).order('rating_average', { ascending: false })
    if (subject) query = query.contains('subjects', [subject])
    if (yearLevel) query = query.contains('year_levels', [parseInt(yearLevel, 10)])
    const { data, error: err } = await query
    if (err) return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (e) { return NextResponse.json({ success: false, error: 'Internal' }, { status: 500 }) }
}
