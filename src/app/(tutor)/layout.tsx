// @ts-nocheck
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import { BoldToggle } from '@/components/accessibility/BoldToggle'
import { IconHome, IconCalendar, IconMoney } from '@/components/icons'
import { Logo } from '@/components/Logo'

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single<{ full_name: string | null; role: string }>()

  if (!profile || profile.role !== 'tutor') redirect('/login')

  return (
    <div className="min-h-screen bg-deep flex flex-col">
      <header className="sticky top-0 z-50 bg-deep/95 backdrop-blur border-b border-teal/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/tutor/tutor/dashboard" className="flex items-center gap-0.5">
            <Logo variant="nav" className="h-7 w-auto" />
          </Link>
          <span className="text-xs text-teech-muted">{profile.full_name ?? ''}</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      <BoldToggle />

      <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 border-t border-teal/10 pb-safe z-40 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {[
              { href: '/tutor/tutor/dashboard', Icon: IconHome,     label: 'Dashboard' },
              { href: '/tutor/sessions',  Icon: IconCalendar, label: 'Sessions'  },
              { href: '/tutor/earnings',  Icon: IconMoney,    label: 'Earnings'  },
            ].map(({ href, Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-teech-muted hover:text-teal transition-colors group"
              >
                <Icon className="w-5 h-5 group-hover:text-teal transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
