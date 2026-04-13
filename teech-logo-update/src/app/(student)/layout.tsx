import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import Link from 'next/link'
import { BoldToggle } from '@/components/accessibility/BoldToggle'
import { IconHome, IconBadge, IconChart } from '@/components/icons'
import { Logo } from '@/components/Logo'

async function getStudentData() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('preferred_name, role')
    .eq('user_id', user.id)
    .single<{ preferred_name: string | null; role: string }>()

  return data
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = await getStudentData()
  if (!student) redirect('/login')
  if (student.role !== 'student') redirect('/login')

  const name = student.preferred_name ?? 'there'

  return (
    <div className="min-h-screen bg-deep flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-deep/95 backdrop-blur border-b border-teal/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-0.5">
            <Logo variant="nav" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-teech-muted">
            <span className="w-2 h-2 rounded-full bg-teal/60 inline-block" aria-hidden />
            <span>{name}</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Accessibility toggle */}
      <BoldToggle />

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 border-t border-teal/10 pb-safe z-40 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {[
              { href: '/dashboard',   Icon: IconHome,   label: 'Learn'   },
              { href: '/badges',      Icon: IconBadge,  label: 'Badges'  },
              { href: '/report',      Icon: IconChart,  label: 'Report'  },
            ].map(({ href, Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl text-teech-muted hover:text-teal transition-colors group"
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
