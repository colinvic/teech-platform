import type { Metadata } from 'next'
import Link from 'next/link'
import { IconShield, IconInfo, IconUser } from '@/components/icons'

export const metadata: Metadata = { title: 'Support | teech.au' }

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <Link href="/" className="flex items-center gap-0 mb-10">
          <span className="font-display text-xl font-black text-white">te</span>
          <span className="font-display text-xl font-black text-teal">e</span>
          <span className="font-display text-xl font-black text-white">ch</span>
          <span className="font-display text-xl font-black text-teal/40">.au</span>
        </Link>

        <p className="label mb-2">Help</p>
        <h1 className="font-display text-4xl font-black text-white mb-3">Support</h1>
        <p className="text-teech-muted text-sm mb-10">We are here to help. Most questions are answered within one business day.</p>

        <div className="space-y-4">
          {[
            {
              Icon: IconUser,
              title: 'General support',
              desc: 'Account questions, progress queries, subscription help.',
              email: 'support@teech.au',
              subject: 'Support request',
            },
            {
              Icon: IconShield,
              title: 'Safety concern',
              desc: 'Report inappropriate tutor behaviour or a child safety concern.',
              email: 'safety@teech.au',
              subject: 'Safety concern',
              urgent: true,
            },
            {
              Icon: IconInfo,
              title: 'Privacy and data',
              desc: 'Data access, correction, or deletion requests.',
              email: 'support@teech.au',
              subject: 'Privacy request',
            },
          ].map(({ Icon, title, desc, email, subject, urgent }) => (
            <a
              key={title}
              href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
              className={`block bg-surface border rounded-2xl p-5 hover:border-teal/40 transition-colors ${urgent ? 'border-red-500/20' : 'border-teal/15'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${urgent ? 'bg-red-500/10' : 'bg-teal/8'}`}>
                  <Icon className={`w-4 h-4 ${urgent ? 'text-red-400' : 'text-teal/70'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                  <p className="text-xs text-teech-muted mb-2">{desc}</p>
                  <p className="text-xs text-teal">{email}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 bg-surface border border-teal/10 rounded-2xl p-5">
          <p className="text-xs font-semibold text-white/70 mb-3 uppercase tracking-widest">Before you email</p>
          <div className="space-y-2 text-xs text-teech-muted">
            {[
              'Check your spam folder for verification emails',
              'Badge not showing? Allow up to 60 seconds after passing',
              'Forgotten which email you used? Try your school address',
              'Parent linking: the parent must register first, then the student signs up using the parent\'s email',
            ].map(tip => (
              <p key={tip} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-teal/60 mt-1.5 flex-shrink-0" />
                {tip}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-teal/10 flex gap-4 text-xs text-teech-muted">
          <Link href="/" className="hover:text-teal transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-teal transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-teal transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  )
}
