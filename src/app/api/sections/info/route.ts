import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })

    const slug = request.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ success: false, error: 'Missing slug' }, { status: 400 })

    const { data: section } = await supabase
      .from('curriculum_sections')
      .select('id, name')
      .eq('slug', slug)
      .eq('is_active', true)
      .single<{ id: string; name: string }>()

    if (!section) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single<{ id: string }>()

    if (!profile) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const { data: progress } = await supabase
      .from('student_section_progress')
      .select('assessment_attempts, last_activity_at')
      .eq('student_id', profile.id)
      .eq('section_id', section.id)
      .single<{ assessment_attempts: number; last_activity_at: string | null }>()

    // Get last fail time
    const { data: flag } = await supabase
      .from('section_fail_flags')
      .select('last_fail_at, fail_count')
      .eq('student_id', profile.id)
      .eq('section_id', section.id)
      .single<{ last_fail_at: string; fail_count: number }>()

    return NextResponse.json({
      success: true,
      data: {
        id: section.id,
        name: section.name,
        attempts: progress?.assessment_attempts ?? 0,
        lastFailAt: flag?.last_fail_at ?? null,
        failCount: flag?.fail_count ?? 0,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
