// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyBadgeSignature, formatBadgeForPublic } from '@/lib/badge'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id?.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ success: false, error: 'Invalid badge ID' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: badge } = await supabase
      .from('badges')
      .select(`
        id, student_id, section_id, assessment_session_id,
        rarity, score_percentage, issued_at, signature, is_revoked,
        section:curriculum_sections(name, subject:curriculum_subjects(name, year_level)),
        student:profiles(full_name)
      `)
      .eq('id', id)
      .single()

    if (!badge) {
      return NextResponse.json({ success: false, error: 'Badge not found' }, { status: 404 })
    }

    // Verify signature
    const isSignatureValid = verifyBadgeSignature(
      {
        badgeId: badge.id as string,
        studentId: badge.student_id as string,
        sectionId: badge.section_id as string,
        issuedAt: new Date(badge.issued_at as string),
      },
      badge.signature as string
    )

    const section = badge.section as { name: string; subject: { name: string; year_level: string } } | null
    const student = badge.student as { full_name: string | null } | null

    const publicData = formatBadgeForPublic({
      badgeId: badge.id as string,
      sectionName: section?.name ?? 'Unknown section',
      subjectName: section?.subject?.name ?? 'Unknown subject',
      yearLevel: section?.subject?.year_level ?? 'unknown',
      scorePercent: badge.score_percentage as number,
      issuedAt: new Date(badge.issued_at as string),
      rarity: badge.rarity as 'standard' | 'first_pass' | 'perfect_score' | 'fast_pass' | 'streak',
      isRevoked: (badge.is_revoked as boolean) || !isSignatureValid,
      preferredName: student?.full_name ?? 'A student',
    })

    return NextResponse.json({ success: true, data: publicData })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
