// @ts-nocheck
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-white/80 mb-1.5">
            {label}
            {props.required && <span className="text-teal ml-1" aria-hidden>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-deep border border-teal/20 text-white placeholder-teech-muted/60',
            'rounded-xl px-4 py-3 text-sm font-normal',
            'transition-colors duration-200',
            'focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal',
            error && 'border-red-500/50 focus:border-red-400 focus:ring-red-400',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-400" role="alert">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-teech-muted">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
