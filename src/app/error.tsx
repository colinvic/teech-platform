'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { IconWarning, IconBack } from '@/components/icons'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Vercel captures unhandled errors automatically in production.
    // No logging needed here — the error boundary exists to give
    // users a recovery path, not to log (which happens at the platform level).
  }, [error])

  return (
    <div className="min-h-screen bg-deep flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full border-2 border-red-500/20 flex items-center justify-center mx-auto mb-8">
          <IconWarning className="w-9 h-9 text-red-400/50" />
        </div>

        <Link href="/" className="inline-flex items-center gap-0 mb-6">
          <span className="font-display text-2xl font-black text-white">te</span>
          <span className="font-display text-2xl font-black text-teal">e</span>
          <span className="font-display text-2xl font-black text-white">ch</span>
          <span className="font-display text-2xl font-black text-teal/40">.au</span>
        </Link>

        <h1 className="font-display text-3xl font-black text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-teech-muted text-sm leading-relaxed mb-8">
          An unexpected error occurred. Your progress has been saved.
          Please try again — if the problem continues, contact support.
        </p>

        {process.env['NODE_ENV'] === 'development' && error.digest && (
          <p className="text-teech-muted/40 text-xs font-mono mb-6 break-all">
            Digest: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="btn-primary w-full justify-center"
          >
            Try again
          </button>
          <Link href="/dashboard" className="btn-ghost w-full justify-center">
            Go to dashboard
          </Link>
          <a
            href={`mailto:support@teech.au?subject=Error report${error.digest ? `&body=Error digest: ${error.digest}` : ''}`}
            className="inline-flex items-center justify-center gap-1.5 text-sm text-teech-muted hover:text-teal transition-colors"
          >
            <IconBack className="w-4 h-4" />
            Contact support
          </a>
        </div>
      </div>
    </div>
  )
}
