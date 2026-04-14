import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import { verifyBadgeSignature, formatBadgeForPublic } from '@/lib/badge'
import { YEAR_LEVEL_LABELS } from '@/lib/constants'
import Link from 'next/link'
import type { YearLevel } from '@/types/platform'
import { Logo } from '@/components/Logo'
import {
  IconBadge,
  IconCheckCircle,
  IconXCircle,
  IconStar,
  IconLightning,
  IconFlame,
  IconVerified,
} from '@/components/icons'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Badge Verification | teech.au' }
}

async function getBadgeData(id: string) {
  const supabase = createAdminClient()
  const { data: badge } = await supabase
    .from('badges')
    .select(`
      id, student_id, section_id, rarity, score_percentage,
      issued_at, signature, is_revoked,
      section:curriculum_sections(name, subject:curriculum_subjects(name, year_level)),
      student:profiles(full_name)
    `)
    .eq('id', id)
    .single()

  if (!badge) return null

  const section = badge.section as { name: string; subject: { name: string; year_level: string } } | null
  const student  = badge.student  as { full_name: string | null } | null

  const isSignatureValid = verifyBadgeSignature(
    { badgeId: badge.id as string, studentId: badge.student_id as string, sectionId: badge.section_id as string, issuedAt: new Date(badge.issued_at as string) },
    badge.signature as string
  )

  return formatBadgeForPublic({
    badgeId:       badge.id as string,
    sectionName:   section?.name ?? 'Unknown',
    subjectName:   section?.subject?.name ?? 'Unknown',
    yearLevel:     section?.subject?.year_level ?? 'year_9',
    scorePercent:  badge.score_percentage as number,
    issuedAt:      new Date(badge.issued_at as string),
    rarity:        badge.rarity as 'standard' | 'first_pass' | 'perfect_score' | 'fast_pass' | 'streak',
    isRevoked:     (badge.is_revoked as boolean) || !isSignatureValid,
    preferredName: student?.full_name ?? 'A student',
  })
}

const RARITY_CONFIG = {
  standard:      { label: 'Pass',          Icon: IconBadge,     iconClass: 'text-teal',       border: 'border-teal/40' },
  first_pass:    { label: 'First Attempt', Icon: IconLightning,  iconClass: 'text-lime',       border: 'border-lime/40' },
  perfect_score: { label: 'Perfect Score', Icon: IconStar,       iconClass: 'text-amber',      border: 'border-amber/50' },
  fast_pass:     { label: 'Fast Pass',     Icon: IconLightning,  iconClass: 'text-purple-400', border: 'border-purple-400/40' },
  streak:        { label: 'On a Streak',   Icon: IconFlame,      iconClass: 'text-orange-400', border: 'border-orange-400/40' },
} as const

export default async function BadgeVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = await params
  const badge   = await getBadgeData(id)
  if (!badge) notFound()

  const config     = RARITY_CONFIG[badge.rarity as keyof typeof RARITY_CONFIG] ?? RARITY_CONFIG.standard
  const { Icon }   = config
  const issuedDate = new Date(badge.issuedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const yearLabel  = YEAR_LEVEL_LABELS[badge.yearLevel as YearLevel] ?? badge.yearLevel

  return (
    <div className="min-h-screen bg-deep flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-0 mb-12">
        <Logo variant="nav" className="h-8 w-auto" />
      </Link>

      <div className={`w-full max-w-sm bg-surface rounded-3xl p-8 text-center border-2 ${badge.isValid ? config.border : 'border-red-500/40'}`}>
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border ${badge.isValid ? 'bg-lime/12 text-lime border-lime/25' : 'bg-red-500/12 text-red-400 border-red-500/25'}`}>
          {badge.isValid ? <IconCheckCircle className="w-3.5 h-3.5" /> : <IconXCircle className="w-3.5 h-3.5" />}
          <span>{badge.isValid ? 'Verified credential' : 'Invalid or revoked'}</span>
        </div>

        <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mx-auto mb-4 ${badge.isValid ? config.border : 'border-red-500/40'}`}>
          {badge.isValid ? <Icon className={`w-9 h-9 ${config.iconClass}`} /> : <IconXCircle className="w-9 h-9 text-red-400" />}
        </div>

        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${config.iconClass}`}>{config.label}</p>
        <h1 className="font-display text-2xl font-bold text-white mb-1">{badge.sectionName}</h1>
        <p className="text-teech-muted text-sm mb-6">{badge.subjectName} &middot; {yearLabel}</p>

        <div className="bg-deep border border-teal/15 rounded-2xl p-4 mb-6">
          <p className="font-display text-4xl font-black text-teal">{badge.scorePercent.toFixed(0)}%</p>
          <p className="text-xs text-teech-muted mt-1">Assessment score</p>
        </div>

        <div className="space-y-1 text-sm text-teech-muted">
          <p>Awarded to <span className="text-white font-semibold">{badge.studentDisplayName}</span></p>
          <p>{issuedDate}</p>
        </div>
      </div>

      <div className="mt-8 text-center max-w-sm space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs text-teech-muted/70">
          <IconVerified className="w-3.5 h-3.5 text-teal/50" />
          <span>Issued by <span className="text-teal">teech.au</span> and cryptographically verified.</span>
        </div>
        <p className="text-[10px] text-teech-muted/40 font-mono break-all">{badge.badgeId}</p>
      </div>

      <Link href="/" className="mt-8 text-xs text-teech-muted hover:text-teal transition-colors inline-flex items-center gap-1">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5" aria-hidden={true}><path d="M10 13L5 8l5-5" /></svg>
        Learn more about teech.au
      </Link>
    </div>
  )
}
