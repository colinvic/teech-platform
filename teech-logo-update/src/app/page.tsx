import type { Metadata } from 'next'
import Link from 'next/link'
import {
import { Logo } from '@/components/Logo'
  IconBook, IconLightning, IconBadge,
  IconShield, IconCheckCircle, IconMobile,
  IconGlobe, IconVerified, IconStar,
  IconGraduate, IconTarget, IconUser,
} from '@/components/icons'

export const metadata: Metadata = {
  title: 'teech.au — Australian Learning Platform',
  description:
    "Australia's mobile-first, ACARA-aligned learning platform. Pass curriculum sections, earn verified badges, and connect with expert tutors — anywhere in Australia.",
}

// Pure CSS principle indicators — no emojis
const PRINCIPLES = [
  { Icon: IconShield,      label: 'Secure by design'   },
  { Icon: IconCheckCircle, label: 'Honest metrics'      },
  { Icon: IconMobile,      label: 'Mobile-first'        },
  { Icon: IconStar,        label: 'Fair for all'        },
  { Icon: IconTarget,      label: 'Transparent AI'      },
  { Icon: IconGlobe,       label: 'Data in Australia'   },
  { Icon: IconUser,        label: 'Gender neutral'      },
]

const HOW_IT_WORKS = [
  {
    Icon: IconBook,
    step: '01',
    title: 'Learn',
    desc: 'Work through bite-sized, curriculum-aligned content cards at your own pace — wherever you are.',
    border: 'border-teal/25 bg-teal/4',
    accent: 'text-teal',
    iconBg: 'bg-teal/10 border-teal/20',
  },
  {
    Icon: IconLightning,
    step: '02',
    title: 'Practise',
    desc: 'Unlimited adaptive practice questions with instant explanations. No time pressure. No judgement.',
    border: 'border-lime/25 bg-lime/4',
    accent: 'text-lime',
    iconBg: 'bg-lime/10 border-lime/20',
  },
  {
    Icon: IconBadge,
    step: '03',
    title: 'Pass & prove it',
    desc: 'Clear a verified assessment at 80% or above. Earn a cryptographically-signed badge — a real credential.',
    border: 'border-amber/25 bg-amber/4',
    accent: 'text-amber',
    iconBg: 'bg-amber/10 border-amber/20',
  },
]

const STATS = [
  { value: 'F–12',  label: 'All year levels'  },
  { value: 'ACARA', label: 'v9 aligned'        },
  { value: 'AU',    label: 'Data stays here'   },
  { value: '80%',   label: 'To pass and badge' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-deep text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-deep/90 backdrop-blur-xl border-b border-teal/10">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/"><Logo variant="nav" className="h-8 w-auto" /></Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost text-sm px-4 py-2">Log in</Link>
            <Link href="/register/student" className="btn-primary text-sm px-4 py-2">Start free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-teal animate-spark-pulse" aria-hidden />
          <span className="text-xs font-bold uppercase tracking-widest text-teal">
            ACARA Version 9 · Foundation to Year 12
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl font-black leading-[1.05] mb-6">
          <span className="text-white">Every student</span><br />
          <span className="text-gradient-teal">deserves to</span><br />
          <span className="text-white">pass.</span>
        </h1>

        <p className="text-teech-muted text-lg sm:text-xl max-w-xl leading-relaxed mb-10">
          teech.au is Australia&apos;s mobile-first learning platform. Work through ACARA
          curriculum sections, earn verified badges, and connect with expert tutors
          — from anywhere in Australia.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/register/student" className="btn-primary text-base px-8 py-4 glow-teal">
            Start learning free
          </Link>
          <Link href="/register/parent" className="btn-ghost text-base px-8 py-4">
            I&apos;m a parent or guardian
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-14 pt-10 border-t border-teal/10">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl font-black text-teal">{s.value}</p>
              <p className="text-xs text-teech-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <p className="label text-center mb-3">How it works</p>
        <h2 className="font-display text-3xl sm:text-4xl font-black text-center text-white mb-12">
          Three steps. Real results.
        </h2>

        <div className="grid sm:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map(({ Icon, step, title, desc, border, accent, iconBg }) => (
            <div
              key={step}
              className={`border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${border}`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${accent}`} />
                </div>
                <span className={`font-mono text-xs font-bold opacity-40 ${accent}`}>{step}</span>
              </div>
              <h3 className={`font-display text-xl font-bold mb-2 ${accent}`}>{title}</h3>
              <p className="text-sm text-teech-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Badge callout */}
      <section className="max-w-5xl mx-auto px-5 py-10">
        <div className="bg-surface border border-teal/15 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal/6 rounded-full blur-3xl pointer-events-none" aria-hidden />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-lime/4 rounded-full blur-3xl pointer-events-none" aria-hidden />

          <div className="relative z-10 sm:flex items-center gap-10">
            <div className="flex-1 mb-8 sm:mb-0">
              <p className="label mb-3">Verified credentials</p>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                Badges that actually<br />
                <span className="text-gradient-teal">mean something.</span>
              </h2>
              <p className="text-teech-muted text-sm leading-relaxed mb-6">
                Every pass generates a cryptographically-signed badge stored on our servers.
                Share a link — anyone can verify it is real. No fakes. No screenshots.
                A credential tied to your actual performance.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  'HMAC-SHA256 signed',
                  'Live verification',
                  'Score included',
                  'Date stamped',
                ].map(f => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 bg-teal/10 border border-teal/20 text-teal text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {/* Inline checkmark — no external icon needed for this scale */}
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0" aria-hidden>
                      <polyline points="10 3 5 9 2 6" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Mock badge — pure CSS, no emojis */}
            <div className="flex-shrink-0 w-full sm:w-56">
              <div className="bg-deep border-2 border-teal/40 rounded-2xl p-6 text-center glow-teal">
                {/* Badge icon */}
                <div className="w-14 h-14 rounded-full border-2 border-lime/50 flex items-center justify-center mx-auto mb-3 animate-badge-pop">
                  <IconBadge className="w-7 h-7 text-lime" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal mb-1">Verified Pass</p>
                <p className="font-display text-base font-bold text-white mb-1">Cell Biology</p>
                <p className="text-[11px] text-teech-muted mb-3">Science · Year 9</p>
                <div className="bg-surface rounded-xl p-2">
                  <p className="font-display text-3xl font-black text-teal">94%</p>
                  <p className="text-[9px] text-teech-muted">Assessment score</p>
                </div>
                <div className="flex items-center justify-center gap-1 mt-3">
                  <IconVerified className="w-3 h-3 text-teal/50" />
                  <p className="text-[9px] text-teal/50">teech.au · Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tutor marketplace callout */}
      <section className="max-w-5xl mx-auto px-5 py-10">
        <div className="bg-surface border border-lime/15 rounded-3xl p-8 sm:p-12">
          <div className="sm:flex items-start gap-10">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-lime mb-3">
                When you get stuck
              </p>
              <h2 className="font-display text-3xl font-black text-white mb-4 leading-tight">
                A verified expert,<br />
                <span className="text-gradient-lime">right when you need one.</span>
              </h2>
              <p className="text-teech-muted text-sm leading-relaxed mb-6">
                Fail a section twice? teech.au connects you with a verified Australian tutor
                for a 30-minute targeted session. They already know exactly what you are
                stuck on — before the session starts.
              </p>
              <div className="space-y-2.5">
                {[
                  'Working With Children checked across all states',
                  'ACARA competency-tested before activation',
                  'Session brief auto-generated from your assessment data',
                  'Post-session pass rate tracked and published on tutor profile',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-teech-muted">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-lime flex-shrink-0 mt-0.5" aria-hidden>
                      <polyline points="13 4 6 11 3 8" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Tutor card — no emojis */}
            <div className="mt-8 sm:mt-0 flex-shrink-0 w-full sm:w-64">
              <div className="bg-deep border border-lime/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  {/* Avatar — CSS initials */}
                  <div className="w-11 h-11 rounded-full bg-surface border-2 border-lime/40 flex items-center justify-center">
                    <IconGraduate className="w-5 h-5 text-lime/70" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Dr. Sarah N.</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <IconVerified className="w-3 h-3 text-lime" />
                      <p className="text-[10px] text-lime font-semibold">WWC Verified</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-teech-muted mb-4">
                  <div className="flex justify-between">
                    <span>Subject</span>
                    <span className="text-white font-medium">Year 9 Science</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pass rate post-session</span>
                    <span className="text-lime font-bold">91%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rating</span>
                    <span className="flex items-center gap-1 text-amber font-bold">
                      <IconStar className="w-3 h-3" filled />
                      4.9
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session rate</span>
                    <span className="text-white font-bold">$49 / 30 min</span>
                  </div>
                </div>
                <div className="w-full bg-lime/12 border border-lime/25 text-lime text-xs font-bold py-2 rounded-lg text-center">
                  Book session — $49
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report card callout */}
      <section className="max-w-5xl mx-auto px-5 py-10">
        <div className="bg-gradient-to-br from-surface to-deep border border-amber/15 rounded-3xl p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-widest text-amber mb-3">
            Living report card
          </p>
          <h2 className="font-display text-3xl font-black text-white mb-4 max-w-lg leading-tight">
            A report card that actually{' '}
            <span className="text-amber">describes you.</span>
          </h2>
          <p className="text-teech-muted text-sm leading-relaxed max-w-xl mb-8">
            Every month, your report card generates a personalised AI paragraph about your
            actual learning style — based on real behavioural data. Your streaks, your
            strongest strand, your retry improvement rate. Not a number. A story.
          </p>

          {/* Mock identity card */}
          <div className="bg-deep border border-amber/20 rounded-2xl p-5 max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber">
                Learning Identity — April 2026
              </p>
              <span className="text-[9px] text-teech-muted bg-surface px-2 py-0.5 rounded-full border border-teal/10">
                AI generated
              </span>
            </div>
            <p className="text-sm text-white/65 leading-relaxed italic">
              &ldquo;Pattern-recognition is your edge. Your first attempt scores average 61%,
              but your retry scores jump to 89% — one of the highest improvement rates on the
              platform. You learn by doing. Earth &amp; Space Sciences is your strongest strand
              right now. You have not touched Chemistry in 9 days — that is where your next
              badge is waiting.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-t border-teal/8 bg-surface/30 py-10">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-xs text-teech-muted mb-6 font-medium uppercase tracking-widest">
            Built on 7 non-negotiable principles
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {PRINCIPLES.map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 text-xs font-semibold text-teech-muted border border-teal/10 rounded-full px-4 py-1.5 bg-deep/40"
              >
                <Icon className="w-3.5 h-3.5 text-teal/60 flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-5 py-20 text-center">
        <h2 className="font-display text-4xl sm:text-5xl font-black text-white mb-4">
          Ready to pass?
        </h2>
        <p className="text-teech-muted text-base mb-8 max-w-sm mx-auto">
          Free to start. No credit card. Australian curriculum. Your phone. Let&apos;s go.
        </p>
        <Link href="/register/student" className="btn-primary text-lg px-10 py-5 glow-teal">
          Start learning free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal/8 py-10">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/"><Logo variant="nav" className="h-7 w-auto" /></Link>
            <p className="text-xs text-teech-muted text-center">
              Operated by Flecco Group Pty Ltd ATF Flecco Family Trust · Perth, Western Australia
            </p>
            <div className="flex gap-4 text-xs text-teech-muted">
              <Link href="/privacy"  className="hover:text-teal transition-colors">Privacy</Link>
              <Link href="/terms"    className="hover:text-teal transition-colors">Terms</Link>
              <Link href="/support"  className="hover:text-teal transition-colors">Support</Link>
            </div>
          </div>
          <p className="text-center text-xs text-teech-muted/30 mt-6">
            &copy; {new Date().getFullYear()} teech.au &nbsp;&middot;&nbsp; teech.com.au &nbsp;&middot;&nbsp; All rights reserved
          </p>
        </div>
      </footer>

    </main>
  )
}
