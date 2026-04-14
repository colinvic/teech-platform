import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import { ProgressBar, StatusPill } from '@/components/ui/card'
import type { SectionCard } from '@/types/platform'

async function getSectionData(slug: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single<{ id: string }>()

  if (!profile) return null

  const { data: section } = await supabase
    .from('curriculum_sections')
    .select('*, subject:curriculum_subjects(name, learning_area)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!section) return null

  const { data: cards } = await supabase
    .from('section_cards')
    .select('*')
    .eq('section_id', section.id)
    .order('order_in_section')

  const { data: progress } = await supabase
    .from('student_section_progress')
    .select('*')
    .eq('student_id', profile.id)
    .eq('section_id', section.id)
    .single()

  return { section, cards: (cards ?? []) as SectionCard[], progress, studentId: profile.id }
}

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getSectionData(slug)

  if (!data) redirect('/login')
  if (!data.section) notFound()

  const { section, cards, progress } = data
  const cardsViewed = progress?.cards_viewed ?? 0
  const cardsTotal = cards.length
  const progressPct = cardsTotal > 0 ? Math.round((cardsViewed / cardsTotal) * 100) : 0
  const isComplete = cardsViewed >= cardsTotal && cardsTotal > 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + header */}
      <div>
        <Link href="/dashboard" className="text-sm text-teech-muted hover:text-teal transition-colors flex items-center gap-1 mb-4">
          â Back to curriculum
        </Link>
        <span className="label block mb-1">{(section as { subject?: { name: string } }).subject?.name}</span>
        <h1 className="font-display text-2xl font-bold text-white">{section.name}</h1>
        <p className="text-teech-muted text-sm mt-2 leading-relaxed">{section.description}</p>
      </div>

      {/* Progress */}
      <div className="bg-surface border border-teal/15 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-teech-muted">Learn progress</span>
          <span className="text-sm font-bold text-teal">{progressPct}%</span>
        </div>
        <ProgressBar value={progressPct} colour="teal" />
        <p className="text-xs text-teech-muted mt-2">{cardsViewed} of {cardsTotal} cards read</p>
      </div>

      {/* ACARA tag */}
      <div className="flex items-center gap-2">
        <StatusPill variant="info" label={`ACARA ${section.acara_descriptor_code}`} />
        <span className="text-xs text-teech-muted/70">~{section.estimated_duration_minutes} min</span>
      </div>

      {/* Content cards */}
      <div className="space-y-4">
        {cards.map((card, index) => {
          const isRead = index < cardsViewed

          return (
            <div
              key={card.id}
              className={`bg-surface border rounded-2xl p-5 transition-all duration-200 ${
                isRead ? 'border-lime/25' : 'border-teal/15'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-white text-base">{card.title}</h3>
                {isRead && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-lime flex-shrink-0" aria-label="Read">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              </div>

              {/* Render content â cards use markdown-style content */}
              <div className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">
                {card.content}
              </div>

              {card.media_url && (
                <div className="mt-4 rounded-xl overflow-hidden bg-deep border border-teal/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.media_url}
                    alt={card.alt_text ?? card.title}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-teech-muted/70">
                  Card {index + 1} of {cardsTotal}
                </span>
                {!isRead && (
                  <MarkCardReadButton
                    studentId={data.studentId}
                    sectionId={section.id}
                    cardIndex={index + 1}
                    cardsTotal={cardsTotal}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA when all cards read */}
      {isComplete && (
        <div className="bg-teal/8 border border-teal/25 rounded-2xl p-6 text-center animate-slide-up">
          <div className="w-14 h-14 rounded-full border-2 border-teal/40 flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-7 h-7 text-teal" aria-label="Ready"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Ready to practise?</h2>
          <p className="text-teech-muted text-sm mb-4">
            You&apos;ve read all the content for {section.name}. Test your understanding before the assessment.
          </p>
          <Link href={`/section/${slug}/practice`} className="btn-primary">
            Start practising â
          </Link>
        </div>
      )}

      {/* Empty state */}
      {cards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-teech-muted text-sm">Content for this section is being prepared. Check back soon.</p>
        </div>
      )}
    </div>
  )
}

// Client component for marking cards as read
function MarkCardReadButton({
  studentId,
  sectionId,
  cardIndex,
  cardsTotal,
}: {
  studentId: string
  sectionId: string
  cardIndex: number
  cardsTotal: number
}) {
  return (
    <form action={`/api/progress/card-read`} method="POST">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="sectionId" value={sectionId} />
      <input type="hidden" name="cardsViewed" value={cardIndex} />
      <input type="hidden" name="cardsTotal" value={cardsTotal} />
      <button
        type="submit"
        className="text-xs font-semibold text-teal border border-teal/30 rounded-lg px-3 py-1.5 hover:bg-teal/10 transition-colors"
      >
        Mark as read
      </button>
    </form>
  )
}
