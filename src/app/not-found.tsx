import Link from 'next/link'
import { IconBack, IconTarget } from '@/components/icons'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-deep flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Visual indicator */}
        <div className="w-20 h-20 rounded-full border-2 border-teal/20 flex items-center justify-center mx-auto mb-8">
          <IconTarget className="w-9 h-9 text-teal/30" />
        </div>

        {/* teech logo */}
        <Link href="/" className="inline-flex items-center gap-0 mb-6">
          <span className="font-display text-2xl font-black text-white">te</span>
          <span className="font-display text-2xl font-black text-teal">e</span>
          <span className="font-display text-2xl font-black text-white">ch</span>
          <span className="font-display text-2xl font-black text-teal/40">.au</span>
        </Link>

        <h1 className="font-display text-3xl font-black text-white mb-3">
          Page not found
        </h1>
        <p className="text-teech-muted text-sm leading-relaxed mb-8">
          The page you are looking for does not exist, or may have moved.
          If you followed a link, it might be out of date.
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="btn-primary w-full justify-center">
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-sm text-teech-muted hover:text-teal transition-colors"
          >
            <IconBack className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
