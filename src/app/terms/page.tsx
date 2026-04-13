import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms of Service | teech.au' }
const LAST_UPDATED = '12 April 2026'

export default function TermsPage() {
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
        <h1 className="font-display text-4xl font-black text-white mb-2">Terms of Service</h1>
        <p className="text-teech-muted text-sm mb-2">Last updated: {LAST_UPDATED}</p>
        <div className="bg-amber/8 border border-amber/20 rounded-xl px-4 py-3 mb-10">
          <p className="text-xs text-amber/80 leading-relaxed">
            <strong className="text-amber">Important:</strong> These terms are a placeholder pending solicitor review. They are not legally binding until finalised. Do not publish this page to production until your solicitor has approved the final version.
          </p>
        </div>

        <div className="space-y-8 text-sm text-white/65 leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">1. About teech.au</h2>
            <p>teech.au is operated by Flecco Group Pty Ltd ATF Flecco Family Trust (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By creating an account, you agree to these terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">2. Eligibility</h2>
            <p>Students under 18 must have verifiable parental or guardian consent to use the platform. By creating an account for a student under 18, you confirm that you are their parent or guardian and consent to their use of the platform.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">3. Acceptable use</h2>
            <p>You must not: share your account with others; attempt to circumvent assessment integrity measures; impersonate another person; or use the platform for any unlawful purpose.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">4. Academic integrity</h2>
            <p>Assessments must be completed by the account holder without external assistance. We use technical measures to detect irregularities. Badges issued on the basis of fraudulent assessments may be revoked.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">5. Intellectual property</h2>
            <p>All curriculum content, badge designs, and platform code are owned by Flecco Group Pty Ltd. You may not reproduce or redistribute platform content without written permission.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">6. Limitation of liability</h2>
            <p>To the extent permitted by Australian Consumer Law, our liability for any loss arising from use of the platform is limited to the amount you paid us in the preceding 12 months. We do not guarantee specific academic outcomes.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">7. Governing law</h2>
            <p>These terms are governed by the laws of Western Australia. Disputes are subject to the jurisdiction of the courts of Western Australia.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-white mb-3">8. Contact</h2>
            <p>Questions about these terms: <a href="mailto:support@teech.au" className="text-teal hover:underline">support@teech.au</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-teal/10 flex gap-4 text-xs text-teech-muted">
          <Link href="/" className="hover:text-teal transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-teal transition-colors">Privacy</Link>
          <Link href="/support" className="hover:text-teal transition-colors">Support</Link>
        </div>
      </div>
    </div>
  )
}
