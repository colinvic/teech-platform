// @ts-nocheck
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { formatAUD, currentFinancialYear } from '@/lib/utils'
import { IconMoney, IconShield } from '@/components/icons'

async function getTutorEarnings() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles').select('id')
    .eq('id', user.id).single<{ id: string }>()

  if (!profile) return null

  const fy = currentFinancialYear()

  const { data: payouts } = await supabase
    .from('payout_records')
    .select('gross_amount, gst_component, platform_fee, net_to_tutor, paid_at, financial_year')
    .eq('tutor_id', profile.id)
    .order('paid_at', { ascending: false })

  const currentFYPayouts = (payouts ?? []).filter(p =>
    (p as { financial_year: string }).financial_year === fy
  )

  const totalGross = currentFYPayouts.reduce((sum, p) => sum + ((p as { gross_amount: number }).gross_amount), 0)
  const totalNet   = currentFYPayouts.reduce((sum, p) => sum + ((p as { net_to_tutor: number }).net_to_tutor), 0)
  const totalGST   = currentFYPayouts.reduce((sum, p) => sum + ((p as { gst_component: number }).gst_component), 0)

  return { payouts: payouts ?? [], currentFYPayouts, totalGross, totalNet, totalGST, fy }
}

export default async function TutorEarningsPage() {
  const data = await getTutorEarnings()
  if (!data) redirect('/login')
  const { payouts, totalGross, totalNet, totalGST, fy } = data

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="label mb-1">Financial year {fy}</p>
        <h1 className="font-display text-3xl font-bold text-white">Earnings</h1>
      </div>

      {/* FY Summary */}
      <div className="bg-surface border border-teal/15 rounded-2xl p-5">
        <p className="label mb-4">This financial year</p>
        {[
          { label: 'Gross sessions total', value: formatAUD(totalGross), note: '' },
          { label: 'GST component',        value: formatAUD(totalGST),   note: 'If GST registered, you owe this to the ATO' },
          { label: 'Platform fee (20%)',    value: formatAUD(totalGross - totalNet - totalGST), note: '' },
          { label: 'Net paid to you',       value: formatAUD(totalNet),   note: '', highlight: true },
        ].map(({ label, value, note, highlight }) => (
          <div key={label} className="flex justify-between items-start py-3 border-b border-teal/8 last:border-0">
            <div>
              <p className="text-sm text-white/65">{label}</p>
              {note && <p className="text-[10px] text-teech-muted mt-0.5">{note}</p>}
            </div>
            <span className={`font-display font-bold text-base ${highlight ? 'text-teal' : 'text-white'}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Tax notice */}
      <div className="flex items-start gap-3 bg-teal/4 border border-teal/10 rounded-xl p-4">
        <IconShield className="w-4 h-4 text-teal/50 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-teech-muted leading-relaxed">
          <p className="font-semibold text-white/70 mb-1">Your tax obligations</p>
          <p>As an independent contractor, you are responsible for declaring your teech.au earnings as business income. If your annual turnover exceeds $75,000, you must register for GST. teech.au does not withhold tax on your behalf. Consult a registered tax agent for advice.</p>
        </div>
      </div>

      {/* Payout history */}
      {payouts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-teech-muted uppercase tracking-widest mb-3">Payout history</p>
          <div className="space-y-2">
            {payouts.map((p, i) => {
              const payout = p as {
                gross_amount: number; net_to_tutor: number; paid_at: string; financial_year: string
              }
              const date = new Date(payout.paid_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
              return (
                <div key={i} className="bg-surface border border-teal/8 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{formatAUD(payout.net_to_tutor)}</p>
                    <p className="text-[10px] text-teech-muted mt-0.5">{date} ÃÂ· FY {payout.financial_year}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-teech-muted">
                    <IconMoney className="w-3.5 h-3.5" />
                    Stripe
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {payouts.length === 0 && (
        <div className="text-center py-10">
          <IconMoney className="w-10 h-10 text-teal/20 mx-auto mb-3" />
          <p className="text-sm text-teech-muted">No payouts yet. Earnings appear here after session completion.</p>
        </div>
      )}
    </div>
  )
}
