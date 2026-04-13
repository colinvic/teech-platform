# teech-platform — BUILD PROGRESS

> **Platform:** teech.au — Australia's mobile-first, ACARA-aligned learning platform with verified tutor marketplace  
> **Operator:** Flecco Group Pty Ltd ATF Flecco Family Trust  
> **Repo:** colinvic/teech-platform  
> **Domains:** teech.au · teech.com.au  
> **Stack:** Next.js 14.2.18 · React 18.3.1 · Supabase (Sydney ap-southeast-2) · Vercel · Claude API · Stripe Connect  
> **Principles:** Security · Honesty · Build Quality · Engaging · Transparent · Fair · Gender Neutral

---

## Resume Prompt
> "Resume teech-platform build. Read BUILD_PROGRESS.md, identify first incomplete step, continue from there. Apply all 7 platform principles. Zero connection to any other Flecco platform."

---

## Phase 0 — Foundation ✅ COMPLETE (code)

### 0.1 Repository & Project Structure
- [x] Directory structure
- [x] BUILD_PROGRESS.md
- [x] README.md
- [x] PLATFORM_PRINCIPLES.md
- [x] package.json (all deps pinned — no caret)
- [x] next.config.js (security headers, CSP, HSTS)
- [x] tsconfig.json (strict mode)
- [x] .env.example (all variables documented)
- [x] .gitignore
- [x] tailwind.config.js (teech design tokens)
- [x] vercel.json (cron schedule)
- [x] postcss.config.js
- [ ] **MANUAL: Push to GitHub** → colinvic/teech-platform

### 0.2 Documentation
- [x] docs/ARCHITECTURE.md
- [x] docs/SECURITY.md
- [x] docs/COMPLIANCE.md
- [x] docs/DATABASE.md
- [x] docs/API.md

### 0.3 Database Migrations
- [x] 001_auth_profiles.sql — profiles, student/parent/tutor, parental consent
- [x] 002_curriculum.sql — ACARA subjects, sections, cards; Year 9 Science seeded
- [x] 003_assessments.sql — progress, fail flags, sessions, questions, badges
- [x] 004_tutor_marketplace.sql — WWC, availability, sessions, reviews, payouts
- [x] 005_audit_log.sql — compliance audit log, learning identities, report card cache
- [x] 006_functions.sql — RPCs: anomaly score, badge count, streak, report cache, mark card read
- [x] 007_auth_trigger.sql — auto-creates profile + role-specific row on signup
- [x] 008_section_unlock.sql — section unlock logic, curriculum map function
- [ ] **MANUAL: Create Supabase project** (ap-southeast-2 — Sydney)
- [ ] **MANUAL: Run migrations** 001 → 008 in order

### 0.4 TypeScript Foundation
- [x] src/types/platform.ts — all platform types, no `any`, intersection types for joins
- [x] src/lib/supabase.ts — browser + server + admin clients (SSR-safe)
- [x] src/lib/constants.ts — all magic numbers and brand values
- [x] src/lib/utils.ts — formatting, anomaly scoring, gender-neutral helpers
- [x] src/lib/badge.ts — HMAC-SHA256 signing, rarity calculation, verification URL
- [x] src/lib/claude.ts — question generation, session briefs, learning identity (zero PII to Claude)
- [x] src/lib/stripe.ts — checkout, Connect payouts, refunds, GST calculation
- [x] src/lib/email.ts — Resend integration; 4 templates (consent, tutor prompt, WWC alert, monthly report)
- [x] src/lib/logger.ts — structured JSON logger (replaces all console.log/error)

### 0.5 Component System
- [x] src/components/icons/index.tsx — 38 pure SVG icons, zero emojis, all accessible
- [x] src/components/ui/button.tsx — 4 variants, loading state, keyboard accessible
- [x] src/components/ui/card.tsx — Card, ProgressBar (teal/lime/red), StatusPill, SectionStatusIcon
- [x] src/components/ui/input.tsx — label, error, hint, required indicator, accessible
- [x] src/components/accessibility/AccessibilityProvider.tsx — bold mode context, localStorage, SSR-safe
- [x] src/components/accessibility/BoldToggle.tsx — spectacles icon, aria-pressed, above bottom nav

### 0.6 CSS & Accessibility
- [x] src/app/globals.css — teech brand tokens, component classes, bold mode CSS (50 lines)
- [x] Zero emojis across all 72+ files (verified by automated audit)
- [x] Bold mode toggle on all authenticated screens (student, parent, auth layouts)

### 0.7 Middleware & Security
- [x] src/middleware.ts — auth protection, role gating, marketplace legal gate (MARKETPLACE_LIVE flag)

### 0.8 Environment & Config
- [ ] **MANUAL: Create Supabase project** (ap-southeast-2)
- [ ] **MANUAL: Add env vars to Vercel** (see .env.example)
- [ ] **MANUAL: Create Stripe account + Connect**
- [ ] **MANUAL: Deploy to Vercel** from GitHub

---

## Phase 1 — Authentication & Core ✅ COMPLETE (code)

### 1.1 Auth Pages
- [x] src/app/(auth)/layout.tsx — brand header, data residency footer, BoldToggle
- [x] src/app/(auth)/login/page.tsx — email → OTP flow, no password
- [x] src/app/(auth)/register/student/page.tsx — parental consent gate for under-18
- [x] src/app/(auth)/register/parent/page.tsx — parent account creation
- [x] src/app/api/auth/callback/route.ts — Supabase code exchange
- [x] Tutor registration — gated until legal sign-off (src/app/(auth)/register/tutor/)

### 1.2 Auth Trigger (Database)
- [x] 007_auth_trigger.sql — auto profile + role-specific row on every signup
- [x] Parent–child linking on signup (if parent email provided)
- [x] Gender-neutral defaults (they/them pronoun, avatar_spark)

### 1.3 Session Security
- [x] Middleware enforces auth on all protected routes
- [x] Marketplace gated via NEXT_PUBLIC_MARKETPLACE_LIVE env flag
- [x] Admin routes gated by role check (2FA — add via Supabase dashboard)

---

## Phase 2 — Curriculum Engine ✅ COMPLETE (code)

### 2.1 ACARA Content
- [x] Year 9 Science seeded in 002_curriculum.sql (16 sections, 4 strands)
- [x] All ACARA descriptor codes and text included
- [x] Section unlock logic in 008_section_unlock.sql

### 2.2 Learn Mode
- [x] src/app/(student)/section/[slug]/learn/page.tsx
- [x] Card-by-card progress tracking via mark_card_read RPC
- [x] SVG check mark on read cards (no emojis)
- [x] Section completion gate → CTA to practice
- [x] src/app/api/progress/card-read/route.ts

### 2.3 Practice Mode
- [x] src/app/(student)/section/[slug]/practice/page.tsx (client component)
- [x] src/app/api/practice/questions/route.ts
- [x] Instant explanation on every answer
- [x] SVG correct/incorrect indicators
- [x] Score threshold → CTA to assessment

### 2.4 Assessment Engine
- [x] src/app/(student)/section/[slug]/assess/page.tsx (client component)
- [x] src/app/api/assessment/start/route.ts — session token, cooldown check
- [x] src/app/api/assessment/question/route.ts — one at a time, deterministic shuffle, anomaly detection
- [x] src/app/api/assessment/submit/route.ts — scoring, badge issuance, fail flag, section unlock
- [x] src/app/api/sections/info/route.ts — cooldown status for assess page
- [x] Anti-cheat: timing, device fingerprint, anomaly score (0–100, >70 = flagged)
- [x] 24-hour cooldown, 80% pass threshold, max 3 attempts → parent notification

### 2.5 Badge System
- [x] HMAC-SHA256 signed badges (badge.ts)
- [x] 5 rarity tiers: standard, first_pass, perfect_score, fast_pass, streak
- [x] Public verification page — src/app/verify/badge/[id]/page.tsx
- [x] Pure CSS rarity icons — no emojis
- [x] src/app/api/badges/verify/route.ts

---

## Phase 3 — Student Report Card ✅ COMPLETE (code)

### 3.1 Student Dashboard
- [x] src/app/(student)/layout.tsx — nav with SVG icons, BoldToggle, greeting
- [x] src/app/(student)/dashboard/page.tsx — stats, curriculum map, section status
- [x] src/app/(student)/badges/page.tsx — badge wall, rarity config, CSS icons
- [x] src/app/(student)/report/page.tsx — learning identity, metrics, strand breakdown

### 3.2 AI Learning Identity
- [x] src/lib/claude.ts — generateLearningIdentity (age-tier aware, gender-neutral)
- [x] src/app/api/claude/identity/route.ts — on-demand generation
- [x] src/app/api/cron/learning-identity/route.ts — monthly batch generation
- [x] Stored in learning_identities table with data snapshot

### 3.3 Parent View
- [x] src/app/(parent)/layout.tsx — nav, BoldToggle
- [x] src/app/(parent)/dashboard/page.tsx — children overview, fail flag alerts
- [x] src/app/(parent)/child/[id]/page.tsx — full child report, strand breakdown, badges
- [x] src/app/(parent)/settings/page.tsx — data rights, consent records, GDPR-style controls
- [x] src/app/api/cron/report-card-refresh/route.ts — monthly cache refresh
- [x] Email: sendMonthlyParentReport template (Resend)

---

## Phase 4 — Admin & Operations ✅ COMPLETE (code)

### 4.1 Admin Dashboard
- [x] src/app/(admin)/dashboard/page.tsx — stats, question review queue, quick links
- [x] src/app/api/admin/questions/approve/route.ts
- [x] src/app/api/admin/questions/reject/route.ts

### 4.2 AI Question Pipeline
- [x] src/app/api/claude/questions/route.ts — generates batch, inserts as inactive
- [x] Human review gate — questions must be approved before students see them
- [x] Audit log on every approval/rejection

### 4.3 Cron Operations
- [x] report-card-refresh — monthly
- [x] learning-identity — monthly
- [x] wwc-expiry-check — daily (alerts + suspends)
- [x] streak-check — daily
- [x] publish-reviews — hourly
- [x] tutor-prompt — daily (parent email when child fails twice)

### 4.4 Structured Logging
- [x] src/lib/logger.ts — JSON structured output, all levels
- [x] Zero console.log/error in production code (verified)

---

## Phase 5 — Tutor Marketplace ⛔ LEGAL GATE

**All database tables, API routes, and payment flows are built. Activation blocked until:**
- [ ] Solicitor signs off: Terms of Service, Privacy Policy, Tutor Service Agreement, Booking Terms
- [ ] NEXT_PUBLIC_MARKETPLACE_LIVE=true set in Vercel env

### Built and waiting:
- [x] 004_tutor_marketplace.sql — all tables
- [x] src/lib/stripe.ts — checkout, Connect payouts, GST, refunds
- [x] src/lib/email.ts — tutor prompt, WWC alert templates
- [x] src/app/api/stripe/checkout/route.ts
- [x] src/app/api/stripe/webhook/route.ts
- [x] src/app/api/cron/wwc-expiry-check/route.ts
- [x] src/app/api/cron/publish-reviews/route.ts

### Remaining (post legal):
- [x] Tutor registration page (src/app/(auth)/register/tutor/)
- [ ] Tutor onboarding — Stripe Identity KYC, WWC verification
- [x] Tutor dashboard, sessions, earnings (src/app/(tutor)/)
- [ ] Booking UI — parent-facing session booking flow
- [ ] Availability calendar
- [ ] Post-session review flow
- [x] Tutor earnings page with FY summary and payout history


### New in latest session
- [x] src/app/not-found.tsx — 404 page
- [x] src/app/error.tsx — global error boundary
- [x] Loading skeleton states for all server-rendered pages
- [x] src/app/(admin)/layout.tsx — admin role gate
- [x] src/app/(auth)/register/tutor/page.tsx — 3-step tutor registration
- [x] src/app/(tutor)/layout.tsx, dashboard, sessions, earnings
- [x] src/app/(parent)/child/[id]/page.tsx — child detail for parent
- [x] src/app/(parent)/settings/page.tsx — data rights and consent records
- [x] src/app/privacy/page.tsx — APP-compliant privacy policy
- [x] src/app/terms/page.tsx — terms placeholder (solicitor review required)
- [x] src/app/support/page.tsx — support contact page
- [x] src/app/api/cron/parent-report/route.ts — monthly parent email
- [x] 32 ACARA content cards seeded across all 16 Year 9 Science sections (002)
- [x] unlock_next_section wired into assessment submit (critical fix)
- [x] initialise_student_progress wired into auth trigger (critical fix)

---

## Phase 6 — Scale (Future)

- [ ] iOS/Android native wrapper (Expo)
- [ ] Additional subjects (Maths Year 9, English Year 9)
- [ ] Additional year levels (7-8, then 5-6, then 3-4)
- [ ] School licence dashboard + teacher view
- [ ] Parent Insights subscription tier
- [ ] NDIS provider registration
- [ ] Senior (11-12) state syllabus integration (SCSA for WA)
- [ ] ESL / bilingual hint system

---

## Manual Steps Before Launch

1. Create GitHub repo: `colinvic/teech-platform` → push all files
2. Create Supabase project — region: `ap-southeast-2` (Sydney)
3. Run migrations 001 → 008 in Supabase SQL editor (in order)
4. Create Stripe account → enable Stripe Connect
5. Import repo to Vercel → set all env vars from `.env.example`
6. Generate `CRON_SECRET`: `openssl rand -hex 32` → add to Vercel
7. Generate `BADGE_SIGNING_SECRET`: `openssl rand -hex 64` → add to Vercel
8. Generate `SESSION_TOKEN_SECRET`: `openssl rand -hex 64` → add to Vercel
9. Set up Resend account → verify `teech.au` domain → add `RESEND_API_KEY`
10. Solicitor sign-off (see solicitor brief) → set `NEXT_PUBLIC_MARKETPLACE_LIVE=true`

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Apr 2026 | Year 9 Science as MVP | Tests all content types; pre-ATAR motivation; objective assessment |
| Apr 2026 | Supabase Sydney (ap-southeast-2) | Data sovereignty — student data never leaves Australia |
| Apr 2026 | Stripe Connect for marketplace | PCI-DSS compliant; handles GST-inclusive split payments natively |
| Apr 2026 | No session recording by default | Privacy-first; opt-in only; explicit dual consent required |
| Apr 2026 | 7 Platform Principles as code-level constraints | Non-negotiable — enforced in every PR review |
| Apr 2026 | Zero emojis — pure CSS/SVG icons | Accessibility, consistency, no rendering variation across devices |
| Apr 2026 | Spectacles bold toggle on all screens | Hard-of-sight users; small screen readability; teech.au quality standard |
| Apr 2026 | Structured logger (not console.log) | Machine-parseable by Vercel log drain; production-grade observability |
| Apr 2026 | Auth trigger in Supabase (not app layer) | Guarantees profile creation even if app crashes; atomic with auth |
| Apr 2026 | Tutor marketplace gated by MARKETPLACE_LIVE flag | Deploy-safe; no live user exposure until legal docs executed |

---

## Dependency Versions (All Pinned — No Caret)

```
next:                  14.2.18
react:                 18.3.1
react-dom:             18.3.1
typescript:            5.4.5
@supabase/supabase-js: 2.43.4
@supabase/ssr:         0.3.0
@anthropic-ai/sdk:     0.24.3
stripe:                15.7.0
zod:                   3.23.8
date-fns:              3.6.0
clsx:                  2.1.1
tailwind-merge:        2.3.0
lucide-react:          0.383.0
crypto-js:             4.2.0
```
