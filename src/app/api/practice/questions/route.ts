// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, getServerSessionUserId } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const userId = await getServerSessionUserId()
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorised', code: 'UNAUTHORISED' }, { status: 401 })
    const supabase = createAdminClient()

    const slug = request.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ success: false, error: 'Missing slug' }, { status: 400 })

    const { data: section } = await supabase
      .from('curriculum_sections')
      .select('id, name')
      .eq('slug', slug)
      .eq('is_active', true)
      .single<{ id: string; name: string }>()

    if (!section) return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 })

    const { data: questions } = await supabase
      .from('assessment_questions')
      .select('id, question_text, options, correct_answer, explanation, difficulty')
      .eq('section_id', section.id)
      .eq('is_active', true)
      .limit(10)

    // Shuffle for variety
    const shuffled = (questions ?? []).sort(() => Math.random() - 0.5)

    return NextResponse.json({
      success: true,
      data: {
        sectionName: section.name,
        questions: shuffled.map(q => ({
          id: q.id,
          questionText: q.question_text,
          options: q.options as Array<{ key: string; text: string }>,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })),
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
