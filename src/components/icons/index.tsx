/**
 * teech-platform — CSS Icon System
 *
 * No emojis. No external icon libraries.
 * Every icon is pure SVG, inline, sized via className.
 * All icons accept a className prop and a title for accessibility.
 * viewBox is always 24x24 unless noted.
 *
 * Usage: <IconBadge className="w-5 h-5 text-teal" />
 */

interface IconProps {
  className?: string
  title?: string
  'aria-hidden'?: boolean
}

const defaults: IconProps = { 'aria-hidden': true }

// ── Navigation & UI ───────────────────────────────────────────────────────────

export function IconHome({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

export function IconBack({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M19 12H5M5 12l7-7M5 12l7 7" />
    </svg>
  )
}

export function IconArrowRight({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

export function IconSettings({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// ── Learning & Education ──────────────────────────────────────────────────────

export function IconBook({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  )
}

export function IconPlay({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  )
}

export function IconLightning({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M13 2L4.5 13.5H11L10 22l9.5-12H13L13 2z" />
    </svg>
  )
}

export function IconTarget({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export function IconStar({ className, title, filled = false, ...rest }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ── Status & Feedback ─────────────────────────────────────────────────────────

export function IconCheck({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconCheckCircle({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export function IconX({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconXCircle({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

export function IconWarning({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconInfo({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function IconLock({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function IconShield({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

// ── People & Users ────────────────────────────────────────────────────────────

export function IconUser({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function IconUsers({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconGraduate({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

// ── Data & Analytics ──────────────────────────────────────────────────────────

export function IconChart({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

export function IconBadge({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <circle cx="12" cy="8" r="6" />
      <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
    </svg>
  )
}

export function IconFlag({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

export function IconCalendar({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function IconClock({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ── Streak & Motivation ───────────────────────────────────────────────────────

export function IconFlame({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M12 2C9 6 7 8.5 7 12c0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.5-.5-2.9-1.3-4C15 9.5 14 11 13 11.5c.5-1.5.5-3-.5-4.5C12.5 6 12 4 12 2z" />
      <path d="M10 17c0 1.1.9 2 2 2s2-.9 2-2c0-.8-.4-1.5-1-1.9C13 17 12 17.5 11 17c-.3-.1-.7-.2-1-.5.1.2.1.3.1.5z" />
    </svg>
  )
}

export function IconMuscle({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M12.5 8.5c-1.5-1.5-4-1.5-5.5 0S5.5 12 7 13.5l5 5c1.5 1.5 4 1.5 5.5 0s1.5-4 0-5.5L13 8.5" />
      <path d="M9 9l2-2" />
      <path d="M16 16l2-2" />
    </svg>
  )
}

// ── Security & Trust ──────────────────────────────────────────────────────────

export function IconVerified({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

export function IconKey({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

// ── Device & Mobile ───────────────────────────────────────────────────────────

export function IconMobile({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

// ── Globe / Australia ─────────────────────────────────────────────────────────

export function IconGlobe({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

// ── Accessibility — Spectacles ────────────────────────────────────────────────
// Used for the bold/large-text toggle button (bottom-left of screen)

export function IconSpectacles({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      {/* Left lens */}
      <circle cx="7" cy="14" r="3.5" />
      {/* Right lens */}
      <circle cx="17" cy="14" r="3.5" />
      {/* Bridge */}
      <path d="M10.5 14h3" />
      {/* Left arm */}
      <path d="M3.5 14Q2 12 2 10" />
      {/* Right arm */}
      <path d="M20.5 14Q22 12 22 10" />
    </svg>
  )
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function IconEdit({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconAudit({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

export function IconContent({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

// ── Tutor & Payment ───────────────────────────────────────────────────────────

export function IconTutor({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      {/* Person */}
      <circle cx="12" cy="6" r="3" />
      <path d="M3 21v-2a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v2" />
      {/* Pointer / teaching indicator */}
      <line x1="19" y1="3" x2="22" y2="3" />
      <line x1="20.5" y1="1.5" x2="20.5" y2="4.5" />
    </svg>
  )
}

export function IconMoney({ className, title, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} {...{ ...defaults, ...rest }}>
      {title && <title>{title}</title>}
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

// ── Section status (replaces emoji status icons) ──────────────────────────────

export function SectionStatusIcon({ status }: { status: string }) {
  const iconClass = 'w-5 h-5 flex-shrink-0'

  switch (status) {
    case 'locked':
      return <IconLock className={`${iconClass} text-teech-muted/50`} title="Locked" aria-hidden={false} />
    case 'available':
      return <IconPlay className={`${iconClass} text-teal`} title="Available" aria-hidden={false} />
    case 'in_progress':
      return <IconLightning className={`${iconClass} text-teal`} title="In progress" aria-hidden={false} />
    case 'passed':
      return <IconCheckCircle className={`${iconClass} text-lime`} title="Passed" aria-hidden={false} />
    case 'mastered':
      return <IconStar className={`${iconClass} text-amber`} filled title="Mastered" aria-hidden={false} />
    default:
      return <div className={`${iconClass} rounded-full border border-teech-muted/30`} aria-label="Unknown status" />
  }
}
