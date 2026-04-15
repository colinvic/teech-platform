// @ts-nocheck
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import type { BadgeWithSection } from '@/types/platform'
import {
  IconBadge, IconStar, IconLightning,
  IconLightning as IconRocket, IconFlame, IconCheckCircle
} from '@/components/icons'

// Badge rarity Ã¢ÂÂ pure CSS styling, no emojis
const RARITY_CONFIG = {
  standard:     { border: 'border-teal/20',       glow: '',                          label: 'Pass',         Icon: IconBadge,     iconClass: 'text-teal'  },
  first_pass:   { border: 'border-lime/40',        glow: 'shadow-lime/10 shadow-lg',  label: 'First Attempt',Icon: IconLightning,  iconClass: 'text-lime'  },
  perfect_score:{ border: 'border-amber/50',       glow: 'shadow-amber/20 shadow-xl', label: 'Perfect Score',Icon: IconStar,       iconClass: 'text-amber' },
  fast_pass:    { border: 'border-purple-400/40',  glow: 'shadow-purple-400/10 shadow-lg', label: 'Fast Pass', Icon: IconLightning, iconClass: 'text-purple-400' },
  streak:       { border: 'border-orange-400/40',  glow: 'shadow-orange-400/10 shadow-lg', label: 'On a Streak', Icon: IconFlame,  iconClass: 'text-orange-400' },
} as const

async function getBadges() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single<{ id: string }>()

  if (!profile) return null

  const { data: badges } = await supabase
    .from('badges')
    .select(`
      *,
      section:curriculum_sections(
        name, strand,
        subject:curriculum_subjects(name, year_level)
      )
    `)
    .eq('student_id', profile.id)
    .eq('is_revoked', false)
    .order('issued_at', { ascending: false })

  return badges as BadgeWithSection[] | null
}

export default async function BadgesPage() {
  const badges = await getBadges()
  if (badges === null) redirect('/login')

  const total = badges.length
  const perfect = badges.filter(b => b.rarity === 'perfect_score').length
  const firstAttempt = badges.filter(b => b.rarity === 'first_pass').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="label mb-1">Your collection</p>
        <h1 className="font-display text-3xl font-bold text-white">Badge Wall</h1>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: total,        label: 'Total badges',   Icon: IconBadge,      colour: 'text-teal' },
            { value: perfect,      label: 'Perfect scores',  Icon: IconStar,       colour: 'text-amber' },
            { value: firstAttempt, label: 'First attempts',  Icon: IconLightning,  colour: 'text-lime'  },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-teal/15 rounded-xl p-3 text-center">
              <s.Icon className={`w-5 h-5 mx-auto mb-1 ${s.colour}`} />
              <div className={`font-display text-xl font-bold ${s.colour}`}>{s.value}</div>
              <div className="text-[9px] text-teech-muted uppercase tracking-wide mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {total > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {badges.map(badge => {
            const config = RARITY_CONFIG[badge.rarity as keyof typeof RARITY_CONFIG] ?? RARITY_CONFIG.standard
            const { Icon } = config
            const issuedDate = new Date(badge.issued_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

            return (
              <Link
                key={badge.id}
                href={badge.verification_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-surface border ${config.border} ${config.glow} rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1 animate-badge-pop`}
              >
                {/* CSS icon replaces emoji */}
                <div className={`w-10 h-10 rounded-full border ${config.border} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 ${config.iconClass}`} />
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-teal mb-1">{config.label}</div>
                <p className="text-xs font-semibold text-white leading-tight mb-1">
                  {badge.section.name}
                </p>
                <p className="text-[10px] text-teech-muted">
                  {badge.score_percentage.toFixed(0)}% ÃÂ· {issuedDate}
                </p>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          {/* CSS badge placeholder Ã¢ÂÂ no emoji */}
          <div className="w-20 h-20 rounded-full border-2 border-teal/20 flex items-center justify-center mx-auto">
            <IconBadge className="w-10 h-10 text-teal/30" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">No badges yet</h2>
          <p className="text-teech-muted text-sm max-w-xs mx-auto leading-relaxed">
            Complete your first assessment to earn your first badge. Badges are cryptographically verified credentials.
          </p>
          <Link href="/dashboard" className="btn-primary inline-flex mt-2">
            Start learning
          </Link>
        </div>
      )}
    </div>
  )
}
