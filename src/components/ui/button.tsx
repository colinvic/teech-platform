// @ts-nocheck
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-deep disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]'

    const variants = {
      primary: 'bg-teal text-deep hover:bg-teal-light',
      ghost:   'bg-transparent border border-teal/25 text-white hover:border-teal hover:text-teal',
      danger:  'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
      success: 'bg-lime/10 border border-lime/30 text-deep hover:bg-lime/20',
    }

    const sizes = {
      sm: 'text-xs px-4 py-2',
      md: 'text-sm px-6 py-3',
      lg: 'text-base px-8 py-4',
    }

    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loadingâ¦</span>
          </>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
