import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'

const schema = z.object({
  sectionId: z.string().uuid(),
  cardsViewed: z.coerce.number().int().min(1),
  cardsTotal: z.coerce.number().int().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const body = await request.formData()
    const parsed = schema.safeParse({
      sectionId: body.get('sectionId'),
      cardsViewed: body.get('cardsViewed'),
      cardsTotal: body.get('cardsTotal'),
    })

    if (!parsed.success) return NextResponse.redirect(new URL('/dashboard', request.url))

    const { sectionId, cardsViewed, cardsTotal } = parsed.data

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single<{ id: string }>()

    if (!profile) return NextResponse.redirect(new URL('/login', request.url))

    await supabase.rpc('mark_card_read', {
      p_student_id: profile.id,
      p_section_id: sectionId,
      p_cards_viewed: cardsViewed,
      p_cards_total: cardsTotal,
    })

    // Get the section slug to redirect back
    const { data: section } = await supabase
      .from('curriculum_sections')
      .select('slug')
      .eq('id', sectionId)
      .single<{ slug: string }>()

    const redirectUrl = section
      ? `/section/${section.slug}/learn`
      : '/dashboard'

    return NextResponse.redirect(new URL(redirectUrl, request.url))
  } catch {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}
