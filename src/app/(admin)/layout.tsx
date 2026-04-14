import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single<{ role: string }>()

  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen bg-deep">
      {children}
    </div>
  )
}
