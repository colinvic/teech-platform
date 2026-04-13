import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy | teech.au' }

const LAST_UPDATED = '12 April 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <Link href="/" className="flex items-center gap-0 mb-10">
          <span className="font-display text-xl font-black text-white">te</span>
          <span className="font-display text-xl font-black text-teal">e</span>
          <span className="font-display text-xl font-black text-white">ch</span>
          <span className="font-display text-xl font-black text-teal/40">.au</span>
        </Link>

        <p className="label mb-2">Legal</p>
        <h1 className="font-display text-4xl font-black text-white mb-2">Privacy Policy</h1>
        <p className="text-teech-muted text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm text-white/65 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Who we are</h2>
            <p>teech.au is operated by Flecco Group Pty Ltd ATF Flecco Family Trust, registered in Western Australia, Australia. We provide an online learning platform for Australian students.</p>
            <p className="mt-3">Contact us: <a href="mailto:support@teech.au" className="text-teal hover:underline">support@teech.au</a></p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">What personal information we collect</h2>
            <p>We collect only the minimum information necessary to provide the platform:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Email address — for account authentication',
                'Preferred name — displayed on badges and report cards',
                'Year level — to serve the correct ACARA curriculum',
                'Assessment responses — to score your results and issue badges',
                'Progress data — to track which sections you have completed',
                'Device fingerprint — to protect the integrity of assessments (non-identifying)',
                'IP address — for security and fraud prevention, stored for 90 days',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal/60 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">We do not collect date of birth, home address, phone number, or any information not listed above.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">How we use your information</h2>
            <p>We use your personal information only to:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Authenticate your account',
                'Deliver ACARA-aligned learning content at your year level',
                'Score your assessments and issue verified badges',
                'Generate your monthly learning report card',
                'Send progress reports to your linked parent or guardian',
                'Detect and prevent assessment fraud',
                'Comply with our legal obligations',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal/60 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-semibold text-white">We never sell your data. We never use your data for advertising. We never share your data with third parties except as described below.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Where your data is stored</h2>
            <p>All personal data is stored in Australia — specifically in the Sydney region (AWS ap-southeast-2) via Supabase.</p>
            <p className="mt-3">We use the following third-party processors, each disclosed in accordance with APP 8:</p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                { name: 'Supabase (Sydney, Australia)', purpose: 'Database and authentication hosting' },
                { name: 'Anthropic Claude API (USA)', purpose: 'AI question generation and learning identity text — no student PII is sent' },
                { name: 'Stripe (USA)', purpose: 'Payment processing for tutor sessions — we do not store card details' },
                { name: 'Vercel (USA)', purpose: 'Web hosting and CDN — no personal data is cached at the edge' },
                { name: 'Resend (USA)', purpose: 'Transactional email delivery' },
              ].map(({ name, purpose }) => (
                <li key={name} className="bg-surface border border-teal/8 rounded-lg px-3 py-2">
                  <span className="text-white font-medium">{name}</span>
                  <span className="text-teech-muted"> — {purpose}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Parental consent (under 18)</h2>
            <p>Students under 18 require verifiable parental or guardian consent to create an account. We record the consent with a timestamp and IP address, in accordance with the Privacy Act 1988 (Cth) and the forthcoming Children&apos;s Online Privacy Code.</p>
            <p className="mt-3">Parents and guardians have full access to their child&apos;s data and can request correction or deletion at any time.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Your rights</h2>
            <p>Under the Privacy Act 1988 (Cth) and the Australian Privacy Principles, you have the right to:</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                'Access all personal data we hold about you',
                'Correct inaccurate data',
                'Request deletion of your account and all associated data (processed within 30 days)',
                'Complain to the OAIC if you believe your privacy rights have been breached',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal/60 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">To exercise any of these rights, email <a href="mailto:support@teech.au" className="text-teal hover:underline">support@teech.au</a>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">Complaints</h2>
            <p>If you have a complaint about how we handle your personal information, please contact us first at <a href="mailto:support@teech.au" className="text-teal hover:underline">support@teech.au</a>. If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at <a href="https://www.oaic.gov.au" className="text-teal hover:underline" target="_blank" rel="noopener noreferrer">www.oaic.gov.au</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-teal/10 flex gap-4 text-xs text-teech-muted">
          <Link href="/" className="hover:text-teal transition-colors">Home</Link>
          <Link href="/terms" className="hover:text-teal transition-colors">Terms</Link>
          <Link href="/support" className="hover:text-teal transition-colors">Support</Link>
        </div>
      </div>
    </div>
  )
}
