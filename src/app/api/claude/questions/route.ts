import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { generateQuestions } from '@/lib/claude'

const schema = z.object({
  sectionId: z.string().uuid(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  count: z.number().int().min(5).max(30).default(15),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 401 })

    // Only admins can trigger question generation
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single<{ role: string }>()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json() as unknown
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })

    const { sectionId, difficulty, count } = parsed.data

    const { data: section } = await supabase
      .from('curriculum_sections')
      .select('name, acara_descriptor_code, acara_descriptor_text, strand')
      .eq('id', sectionId)
      .single<{ name: string; acara_descriptor_code: string; acara_descriptor_text: string; strand: string }>()

    if (!section) return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 })

    const questions = await generateQuestions(section, count, difficulty)

    // Insert as inactive — require human review before going live
    const adminClient = createAdminClient()
    const { data: inserted } = await adminClient
      .from('assessment_questions')
      .insert(questions.map(q => ({
        section_id: sectionId,
        question_type: 'multiple_choice',
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        acara_descriptor_code: section.acara_descriptor_code,
        generated_by_ai: true,
        reviewed_by_human: false,
        is_active: false,  // Must be reviewed before active
      })))
      .select('id')

    // Audit log
    await adminClient.from('compliance_audit_log').insert({
      actor_id: user.id,
      actor_role: 'admin',
      action: 'questions.generated',
      table_name: 'assessment_questions',
      after_data: { section_id: sectionId, count: inserted?.length ?? 0, difficulty },
    })

    return NextResponse.json({
      success: true,
      data: {
        generated: inserted?.length ?? 0,
        status: 'pending_review',
        message: 'Questions generated. An admin must review and activate them before students see them.',
      },
    })
  } catch (err) {
    logger.error('claude-questions', 'Question generation failed', { error: String(err) })
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
  }
}
