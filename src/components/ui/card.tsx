import { cn } from '@/lib/utils'
import {
  IconLock, IconPlay, IconLightning,
  IconCheckCircle, IconStar,
} from '@/components/icons'

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: boolean
  hover?: boolean
}

export function Card({ children, className, accent, hover }: CardProps) {
  return (
    <div className={cn(
      'bg-surface border border-teal/20 rounded-2xl p-6',
      accent && 'border-t-[3px] border-t-teal',
      hover && 'transition-all duration-200 hover:border-teal/50 hover:-translate-y-0.5 cursor-pointer',
      className
    )}>
      {children}
    </div>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number
  className?: string
  showLabel?: boolean
  colour?: 'teal' | 'lime' | 'red'
}

export function ProgressBar({ value, className, showLabel, colour = 'teal' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  const colours: Record<'teal' | 'lime' | 'red', string> = {
    teal: 'from-teal to-teal-light',
    lime: 'from-lime to-lime-light',
    red:  'from-red-500 to-red-400',
  }

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-teech-muted">
          <span>Progress</span>
          <span className="font-semibold text-white">{clamped}%</span>
        </div>
      )}
      <div className="h-2 bg-deep rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out',
            colours[colour]
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

// ── Status Pill ───────────────────────────────────────────────────────────────

type PillVariant = 'pass' | 'fail' | 'progress' | 'locked' | 'pending' | 'info'

interface StatusPillProps {
  variant: PillVariant
  label: string
  className?: string
}

export function StatusPill({ variant, label, className }: StatusPillProps) {
  const styles: Record<PillVariant, string> = {
    pass:     'bg-lime/15 text-lime border-lime/25',
    fail:     'bg-red-500/15 text-red-400 border-red-500/25',
    progress: 'bg-teal/15 text-teal border-teal/25',
    locked:   'bg-raised/60 text-teech-muted border-teal/8',
    pending:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
    info:     'bg-raised text-white/70 border-teal/15',
  }

  const dots: Record<PillVariant, string> = {
    pass:     'bg-lime',
    fail:     'bg-red-400',
    progress: 'bg-teal',
    locked:   'bg-teech-muted/40',
    pending:  'bg-blue-400',
    info:     'bg-white/30',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border',
      styles[variant],
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dots[variant])} aria-hidden />
      {label}
    </span>
  )
}

// ── Section Status Icon ───────────────────────────────────────────────────────

export function SectionStatusIcon({ status }: { status: string }) {
  const cls = 'w-5 h-5 flex-shrink-0'

  switch (status) {
    case 'locked':
      return <IconLock className={`${cls} text-teech-muted/40`} title="Locked" aria-hidden={false} />
    case 'available':
      return <IconPlay className={`${cls} text-teal`} title="Available" aria-hidden={false} />
    case 'in_progress':
      return <IconLightning className={`${cls} text-teal`} title="In progress" aria-hidden={false} />
    case 'passed':
      return <IconCheckCircle className={`${cls} text-lime`} title="Passed" aria-hidden={false} />
    case 'mastered':
      return <IconStar className={`${cls} text-amber`} filled title="Mastered" aria-hidden={false} />
    default:
      return (
        <div className={`${cls} rounded-full border border-teech-muted/20`} role="img" aria-label="Unknown status" />
      )
  }
}
