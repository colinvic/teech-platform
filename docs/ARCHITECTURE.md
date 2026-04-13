# teech-platform — Architecture

## Overview

teech-platform is a Next.js 14 App Router application using Supabase for database and auth, Stripe Connect for payments, and the Anthropic Claude API for adaptive learning intelligence.

```
Browser / Mobile PWA
        │
        ▼
   Vercel Edge (CDN)
        │
        ▼
Next.js App Router (Server + Client Components)
        │
   ┌────┴─────────────────────────────┐
   │                                  │
Supabase (Sydney)              Anthropic API
PostgreSQL + Auth              claude-sonnet-4-x
RLS on all tables              Question generation
                               Session briefs
   │                           Learning identity
   │                                  │
Stripe Connect                        │
Payments + Payouts             ───────┘
GST handling
```

---

## Data Flow Principles

1. **Student PII never leaves Australia** — Supabase is hosted in ap-southeast-2 (Sydney). Student personal data is not replicated offshore.

2. **Claude API receives minimum-necessary data** — Questions are generated from ACARA section descriptors + difficulty level. No student name, no age, no location is sent to Claude for question generation. Session briefs for tutors contain section data and error patterns only — not student PII.

3. **Stripe processes payment data** — Stripe is PCI-DSS Level 1 compliant. We do not store card numbers anywhere in our systems.

4. **Admin client is server-only** — The Supabase service role key is never exposed to the browser. The admin client is used only for:
   - Compliance audit log writes
   - Webhook handlers (Stripe)
   - Scheduled jobs (cron)

---

## App Router Structure

```
src/app/
├── layout.tsx                  # Root layout — fonts, globals
├── globals.css
├── page.tsx                    # Landing page (unauthenticated)
│
├── (auth)/                     # Auth group — no sidebar
│   ├── login/page.tsx
│   ├── register/
│   │   ├── student/page.tsx    # Student registration (under-18 gate)
│   │   ├── parent/page.tsx     # Parent registration
│   │   └── tutor/page.tsx      # Tutor registration (gated — legal docs required)
│   └── verify/page.tsx         # Email/OTP verification
│
├── (student)/                  # Student authenticated group
│   ├── layout.tsx              # Student shell — nav, streak
│   ├── dashboard/page.tsx      # Home — curriculum map
│   ├── section/[slug]/
│   │   ├── learn/page.tsx      # Learn mode
│   │   ├── practice/page.tsx   # Practice mode
│   │   └── assess/page.tsx     # Assessment (Pass) mode
│   ├── badges/page.tsx         # Badge wall
│   └── report/page.tsx         # Living report card
│
├── (parent)/                   # Parent authenticated group
│   ├── layout.tsx
│   ├── dashboard/page.tsx      # Children overview
│   ├── child/[id]/page.tsx     # Individual child report
│   └── settings/page.tsx       # Notifications, consent management
│
├── (tutor)/                    # Tutor authenticated group ⛔ legal gate
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── sessions/page.tsx
│   └── earnings/page.tsx
│
├── (admin)/                    # Admin group — 2FA required
│   ├── layout.tsx
│   └── dashboard/page.tsx
│
├── verify/badge/[id]/page.tsx  # Public badge verification — no auth
└── api/
    ├── auth/callback/route.ts  # Supabase auth callback
    ├── assessment/
    │   ├── start/route.ts
    │   ├── question/route.ts   # Serves one question at a time
    │   └── submit/route.ts
    ├── claude/
    │   ├── questions/route.ts  # Generate question bank
    │   └── identity/route.ts   # Generate learning identity paragraph
    ├── stripe/
    │   ├── checkout/route.ts
    │   └── webhook/route.ts    # Stripe webhook handler
    └── badges/verify/route.ts  # Badge verification API
```

---

## Authentication Flow

```
User registers
      │
      ▼
Supabase Auth (email + OTP)
      │
      ▼
Profile created (trigger on auth.users insert)
      │
      ├── role = 'student' → student_profiles row created
      │        └── under 18? → parental_consent_records required
      ├── role = 'parent'  → parent_profiles row created
      └── role = 'tutor'   → tutor_profiles row created (status = 'pending')
```

## Assessment Flow (Security-Critical)

```
Student clicks "Start Assessment"
      │
      ▼
API checks: cooldown expired? max attempts not reached?
      │
      ▼
New assessment_sessions row created
  - Unique session_token (32 bytes random hex)
  - token_expires_at = now() + 45 minutes
  - device_fingerprint captured
  - ip_address captured
      │
      ▼
Questions served ONE AT A TIME via /api/assessment/question
  - Never returned as a batch
  - Question IDs never exposed to client
  - Options order randomised server-side
      │
      ▼
Each response submitted to /api/assessment/submit
  - Token validated on every request
  - Time-per-question recorded
  - Anomaly score updated incrementally
      │
      ▼
Assessment complete → score calculated
  - Pass (≥80%): badge issued, section_fail_flag resolved
  - Fail: fail_count incremented
    - fail_count = 2 → section_fail_flag → parent notification
    - fail_count = 3 → parent notified, admin alerted
```

---

## Cron Jobs (Vercel Cron)

| Job | Schedule | Action |
|-----|----------|--------|
| `report-card-refresh` | 1st of each month | Recalculate report_card_cache for all active students |
| `learning-identity-generate` | 2nd of each month | Generate Claude learning identity paragraphs |
| `wwc-expiry-check` | Daily | Alert tutors with WWC expiring within 60 days |
| `streak-reset-check` | Daily 00:01 AWST | Reset streaks for students inactive > 36 hours |
| `session-review-publish` | Every hour | Publish moderated reviews older than 24 hours |
