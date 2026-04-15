// @ts-nocheck
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { IconShield, IconGlobe, IconInfo } from '@/components/icons'

async function getParentSettings() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, full_name')
    .eq('id', user.id)
    .eq('role', 'parent')
    .single<{ id: string; full_name: string | null; full_name: string }>()

  if (!profile) return null

  const { data: parentProfile } = await supabase
    .from('parent_profiles')
    .select('notification_email, notification_push, report_frequency')
    .eq('id', profile.id)
    .single<{ notification_email: boolean; notification_push: boolean; report_frequency: string }>()

  const { data: consentRecords } = await supabase
    .from('parental_consent_records')
    .select('consent_type, granted, granted_at, withdrawn_at')
    .eq('parent_id', profile.id)
    .order('granted_at', { ascending: false })

  return { profile, parentProfile, consentRecords: consentRecords ?? [], userEmail: user.email }
}

export default async function ParentSettingsPage() {
  const data = await getParentSettings()
  if (!data) redirect('/login')

  const { profile, parentProfile, consentRecords, userEmail } = data
  const name = profile.full_name ?? profile.full_name

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="label mb-1">Account</p>
        <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
      </div>

      {/* Account details */}
      <div className="bg-surface border border-teal/15 rounded-2xl p-5">
        <p className="label mb-4">Account details</p>
        <div className="space-y-3">
          {[
            { label: 'Name', value: name },
            { label: 'Email', value: userEmail ?? 'Not set' },
            { label: 'Role', value: 'Parent / Guardian' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-teal/8 last:border-0">
              <span className="text-sm text-teech-muted">{label}</span>
              <span className="text-sm text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & data */}
      <div className="bg-surface border border-teal/15 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <IconShield className="w-4 h-4 text-teal" />
          <p className="label">Your data rights</p>
        </div>
        <div className="space-y-3 text-sm text-teech-muted leading-relaxed">
          <p>
            Under the Privacy Act 1988 (Cth) and the Australian Privacy Principles,
            you have the right to access, correct, and request deletion of all personal
            data teech.au holds about you and your children.
          </p>
          <p>
            All data is stored in Australia (Supabase, Sydney Ã¢ÂÂ AWS ap-southeast-2).
            Your data is never sold or used for advertising.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <a
            href="mailto:support@teech.au?subject=Data access request"
            className="flex items-center justify-between bg-deep border border-teal/12 rounded-xl px-4 py-3 hover:border-teal/30 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-white">Request my data export</p>
              <p className="text-xs text-teech-muted mt-0.5">Receive a full copy of your account data</p>
            </div>
            <span className="text-teal/40 group-hover:text-teal transition-colors text-xs">Email us</span>
          </a>
          <a
            href="mailto:support@teech.au?subject=Account deletion request"
            className="flex items-center justify-between bg-deep border border-red-500/15 rounded-xl px-4 py-3 hover:border-red-500/30 transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-red-400">Request account deletion</p>
              <p className="text-xs text-teech-muted mt-0.5">Permanently delete all account data within 30 days</p>
            </div>
            <span className="text-red-400/40 group-hover:text-red-400 transition-colors text-xs">Email us</span>
          </a>
        </div>
      </div>

      {/* Consent records */}
      {consentRecords.length > 0 && (
        <div className="bg-surface border border-teal/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconInfo className="w-4 h-4 text-teal" />
            <p className="label">Consent records</p>
          </div>
          <p className="text-xs text-teech-muted mb-3 leading-relaxed">
            A full record of all consents you have granted or withdrawn, as required
            by the Australian Privacy Act 1988.
          </p>
          <div className="space-y-2">
            {consentRecords.map((record, i) => {
              const r = record as {
                consent_type: string
                granted: boolean
                granted_at: string
                withdrawn_at: string | null
              }
              const date = new Date(r.granted_at).toLocaleDateString('en-AU')
              return (
                <div key={i} className="flex items-center justify-between bg-deep rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-xs text-white font-medium">
                      {r.consent_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    <p className="text-[10px] text-teech-muted mt-0.5">{date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    r.granted && !r.withdrawn_at
                      ? 'text-lime border-lime/25 bg-lime/10'
                      : 'text-red-400 border-red-500/25 bg-red-500/10'
                  }`}>
                    {r.granted && !r.withdrawn_at ? 'Active' : 'Withdrawn'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Data residency notice */}
      <div className="flex items-start gap-3 bg-teal/5 border border-teal/12 rounded-xl p-4">
        <IconGlobe className="w-4 h-4 text-teal/60 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-teech-muted leading-relaxed">
          All teech.au data is stored in Sydney, Australia (AWS ap-southeast-2).
          No personal data is transferred outside of Australia.
          Operated by Flecco Group Pty Ltd ATF Flecco Family Trust.
        </p>
      </div>
    </div>
  )
}
