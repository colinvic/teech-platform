import Link from 'next/link'
import { BoldToggle } from '@/components/accessibility/BoldToggle'
import { IconGlobe } from '@/components/icons'
import { Logo } from '@/components/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-deep flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-0.5">
          <Logo variant="nav" className="h-8 w-auto" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <BoldToggle />

      <footer className="p-6 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs text-teech-muted">
          <IconGlobe className="w-3.5 h-3.5 text-teal/60" />
          <span>Your data is stored in Australia</span>
          <span className="text-teal/30 mx-1">·</span>
          <Link href="/privacy" className="text-teal/60 hover:text-teal transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  )
}
