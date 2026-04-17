# teech-platform — BUILD PROGRESS

> **Platform:** teech.au — Australia's mobile-first, ACARA-aligned learning platform with verified tutor marketplace  
> **Operator:** Flecco Group Pty Ltd ATF Flecco Family Trust  
> **Repo:** colinvic/teech-platform  
> **Domains:** teech.au · teech.com.au  
> **Stack:** Next.js 14.2.18 · React 18.3.1 · Supabase (Sydney ap-southeast-2) · Vercel · Claude API · Stripe Connect  
> **Principles:** Security · Honesty · Build Quality · Engaging · Transparent · Fair · Gender Neutral

---

## Resume Prompt

> "Resume teech-platform build. Read BUILD_PROGRESS.md. First read the Session Log top entry to see what was last deployed. Then read Known Issues (Live) for active bugs. Then continue from the first incomplete step. Apply all 7 platform principles. Zero connection to any other Flecco platform."

---

## Working Agreements

Claude must update this file:
- **At the start of every session** — read the Session Log top entry and Known Issues before any code change
- **After every deployed commit** — add hash + one-line description to the current Session Log entry
- **When a major bug is identified** — add to Known Issues (Live), with live-fix status and repo-fix owed
- **When a milestone is reached** — tick the relevant Phase item
- **At least once per day** of active build — even if only incremental

Every session's Resume Prompt must answer: *what was the last thing deployed?* and *what is the next concrete step?* — no aspirational language.

This file is the source of truth. The copy attached to Claude Projects is a mirror; always read the GitHub raw version first when in doubt.

---

## Phase 0 — Foundation ✅ COMPLETE

### 0.1 Repository & Project Structure
- [x] Directory structure, BUILD_PROGRESS.md, README.md, PLATFORM_PRINCIPLES.md
- [x] package.json (all deps pinned — no caret)
- [x] next.config.js (security headers, CSP, HSTS)
- [x] tsconfig.json (strict mode)
- [x] .env.example, .gitignore, tailwind.config.js, vercel.json, postcss.config.js
- [x] **Pushed to GitHub** → colinvic/teech-platform

### 0.2 Documentation
- [x] docs/ARCHITECTURE.md, SECURITY.md, COMPLIANCE.md, DATABASE.md, API.md

### 0.3 Database Migrations
- [x] 001_auth_profiles.sql
- [x] 002_curriculum.sql — Year 9 Science seeded (16 sections, 4 strands)
- [x] 003_assessments.sql
- [x] 004_tutor_marketplace.sql
- [x] 005_audit_log.sql
- [x] 006_functions.sql ⚠️ *mark_card_read has a type bug — see Known Issues*
- [x] 007_auth_trigger.sql ⚠️ *id/user_id mismatch — see Known Issues*
- [x] 008_section_unlock.sql
- [x] **Supabase project created** (ap-southeast-2 — Sydney, project asclghdxphfjbmdsyvlx)
- [x] **Migrations 001 → 008 run in order**

### 0.4 TypeScript Foundation
- [x] src/types/platform.ts
- [x] src/lib/supabase.ts — plus `getServerSessionUserId()` helper bypassing @supabase/ssr 0.3.0 cookie bug
- [x] src/lib/constants.ts, utils.ts, badge.ts, claude.ts (zero PII to Claude), stripe.ts, email.ts, logger.ts

### 0.5 Component System
- [x] 38 pure SVG icons, zero emojis
- [x] Button, Card, Input, AccessibilityProvider, BoldToggle

### 0.6 CSS & Accessibility
- [x] Zero emojis verified across all files
- [x] Bold mode toggle on all authenticated screens

### 0.7 Middleware & Security
- [x] src/middleware.ts — auth protection, role gating, marketplace legal gate

### 0.8 Environment & Config
- [x] Supabase project created (ap-southeast-2)
- [x] Env vars set in Vercel
- [ ] **MANUAL: Create Stripe account + Connect**
- [x] **Deployed to Vercel** — https://www.teech.au live

---

## Phase 1 — Authentication & Core ✅ COMPLETE (code + live verified)

### 1.1 Auth Pages
- [x] Auth layout, login (email → OTP), register (student, parent)
- [x] src/app/api/auth/callback/route.ts
- [x] Tutor registration — gated until legal sign-off
- [x] **Live verified:** OTP login works end-to-end for test.student@teech.au

### 1.2 Auth Trigger (Database)
- [x] 007_auth_trigger.sql ⚠️ *id/user_id mismatch*
- [x] Parent–child linking on signup
- [x] Gender-neutral defaults (they/them, avatar_spark)

### 1.3 Session Security
- [x] Middleware enforces auth on all protected routes
- [x] Marketplace gated via NEXT_PUBLIC_MARKETPLACE_LIVE env flag
- [x] Admin routes gated by role check

---

## Phase 2 — Curriculum Engine — LIVE VERIFIED THROUGH LEARN MODE

### 2.1 ACARA Content
- [x] Year 9 Science seeded (16 sections, 4 strands)
- [x] All ACARA descriptor codes included
- [x] **Live verified:** 16 sections render on /dashboard

### 2.2 Learn Mode ✅ LIVE VERIFIED END-TO-END
- [x] Learn page, card tracking via mark_card_read RPC, SVG check marks
- [x] src/app/api/progress/card-read/route.ts ✅ patched cookie-direct auth (commit 671be07)
- [x] **Live verified:** ACARA tag, 2 cards render, Mark as read persists 0→50%→100%, "Ready to practise?" CTA

### 2.3 Practice Mode — API route patched, rendering pending verification
- [x] Practice page, instant explanations, SVG correct/incorrect indicators
- [x] src/app/api/practice/questions/route.ts ✅ patched (commit pending verification)
- [x] **DB seed:** 10 multiple_choice questions live for `y9-sci-multicellular-organisms` (ACSSU175, difficulty 1-3)
- [ ] **LIVE VERIFICATION PENDING**

### 2.4 Assessment Engine — code complete, routes likely need same auth patch
- [x] Assess page, start/question/submit/sections-info routes
- [x] Anti-cheat: timing, fingerprint, anomaly score (0-100, >70 = flagged)
- [x] 24-hour cooldown, 80% pass threshold, max 3 attempts
- [ ] **Suspected pattern bug:** all 4 API routes likely hit @supabase/ssr auth.getUser() bug — needs same fix

### 2.5 Badge System
- [x] HMAC-SHA256 signed badges, 5 rarity tiers, public verification page, CSS rarity icons
- [ ] **Not yet live-verified:** awaiting first passing assessment

---

## Phase 3 — Student Report Card ✅ COMPLETE (code)

### 3.1 Student Dashboard
- [x] Student layout, dashboard (✅ live verified), badges page, report page

### 3.2 AI Learning Identity
- [x] generateLearningIdentity, identity route, cron route, storage in learning_identities

### 3.3 Parent View
- [x] Parent layout, dashboard, child detail, settings with data rights
- [x] report-card-refresh cron, sendMonthlyParentReport

---

## Phase 4 — Admin & Operations ✅ COMPLETE (code)

### 4.1 Admin Dashboard
- [x] Admin dashboard, question approve/reject routes

### 4.2 AI Question Pipeline
- [x] Claude question generation, human review gate, audit logging

### 4.3 Cron Operations
- [x] report-card-refresh (monthly), learning-identity (monthly), wwc-expiry-check (daily), streak-check (daily), publish-reviews (hourly), tutor-prompt (daily)

### 4.4 Structured Logging
- [x] src/lib/logger.ts, zero console.log/error in production

---

## Phase 5 — Tutor Marketplace ⛔ LEGAL GATE

**Activation blocked until:**
- [ ] Solicitor signs off: ToS, Privacy Policy, Tutor Service Agreement, Booking Terms
- [ ] NEXT_PUBLIC_MARKETPLACE_LIVE=true

### Built and waiting:
- [x] All tables, Stripe (checkout, Connect, GST, refunds), email templates
- [x] stripe/checkout, stripe/webhook, cron/wwc-expiry-check, cron/publish-reviews
- [x] Tutor registration page, tutor dashboard/sessions/earnings

### Remaining (post legal):
- [ ] Stripe Identity KYC, WWC verification onboarding
- [ ] Booking UI
- [ ] Availability calendar
- [ ] Post-session review flow

---

## Phase 6 — Scale (Future)

- [ ] iOS/Android native wrapper (Expo)
- [ ] Maths Year 9, English Year 9
- [ ] Additional year levels (7-8, then 5-6, then 3-4)
- [ ] School licence dashboard
- [ ] Parent Insights subscription tier
- [ ] NDIS provider registration
- [ ] Senior (11-12) SCSA for WA
- [ ] ESL / bilingual hint system

---

## Known Issues (Live)

Ordered by severity. Each lists: symptom · root cause · live fix · repo fix owed.

### HIGH

**`@supabase/ssr` 0.3.0 `auth.getUser()` returns null despite valid session**
- Symptom: every API route using `createServerClient + auth.getUser()` returns 401
- Root cause: 0.3.0 cookie parser doesn't decode Supabase's single-cookie session format
- Live fix: `src/lib/supabase.ts` exports `getServerSessionUserId()`; `createServerClient()` injects `Authorization: Bearer` header for data queries (commits 606a0a8, 320c8ae)
- Repo fix owed: upgrade `@supabase/ssr` to 0.5+ OR apply pattern fix to every route. Fixed: card-read, practice/questions. Still owed: assessment/start, assessment/question, assessment/submit, sections/info.

**`mark_card_read` RPC enum type mismatch (006_functions.sql)**
- Symptom: card-read always failed silently, `cards_viewed` stuck at 0
- Root cause: function declared `v_new_status text` but column is enum `section_status`. Every call threw `ERROR: 42804`, swallowed by route's try/catch
- Live fix: CREATE OR REPLACE with `v_new_status section_status` and enum casts
- Repo fix owed: update `supabase/migrations/006_functions.sql` — `db reset` would reintroduce

### MEDIUM

**UTF-8 mojibake in student pages** — `Ã¢ÂÂ` instead of `←`/`→` in learn and practice pages. Repo sweep owed.

**OTP email template says "6-digit" but Supabase emits 8.** Align config or template.

**`assessment_questions.source` column referenced in code but doesn't exist.** Schema has 13 cols; no `source`. Grep owed.

### LOW / COSMETIC

**`src/app/(student)/layout.tsx` has redundant cookie workaround** (post-320c8ae). Revert to clean `createServerClient + auth.getUser` once all API routes patched.

**`007_auth_trigger.sql` creates mismatched (id, user_id) on signup.** Edit `handle_new_user()` to insert `(id, user_id, ...) VALUES (new.id, new.id, ...)`.

---

## Working Techniques

*This section is reserved for persistent, non-obvious technical workarounds that recur across sessions. Only add an entry here when a problem has cost significant time and the workaround is needed again — otherwise keep fixes in commit messages and Session Log notes.*

---

## Session Log

Reverse chronological. Each entry: date (AWST), commits deployed, DB changes, what's working, blockers.

### 2026-04-18 — BUILD_PROGRESS restructure

**Commits deployed:**
- `62d667f` — docs: add Working Agreements + Known Issues + Session Log to BUILD_PROGRESS
- `cab64f1` — docs: add Working Techniques section (reverted in next commit — over-engineered)
- (this commit) — docs: remove over-engineered Working Techniques content, leave placeholder note

**Lesson:** don't carry defensive scaffolding into situations that don't need it. Direct GitHub file editing works fine — the formal "technique" write-up wasn't needed.

**Next concrete step (carrying from 2026-04-17):**
- Verify practice route patch deployed → /practice renders 10 MCQs → walk through to /assess → first badge

### 2026-04-17 — Student journey debug + unblock

**Commits deployed to production (Vercel):**
- `606a0a8` — fix(student): bypass @supabase/ssr 0.3.0 cookie bug in layout
- `320c8ae` — fix(supabase): systemic @supabase/ssr 0.3.0 workaround in createServerClient
- `671be07` — fix(api): cookie-direct auth in card-read route
- (pending verification) — fix(api): cookie-direct auth in practice questions route

**Live DB changes (NOT yet mirrored to repo migrations):**
- 4 test profiles linked — test.student/parent/tutor/admin @ teech.au
- `student_profiles` row for Alex Chen; `initialise_student_progress` executed
- `mark_card_read` RPC replaced with enum-safe version
- 10 `assessment_questions` seeded for `y9-sci-multicellular-organisms`

**Verified working end-to-end on live site:**
- /login → OTP → /dashboard renders with greeting, 16 sections, BoldToggle
- /section/y9-sci-multicellular-organisms/learn — ACARA tag, 2 cards
- Mark Card 1 → 50%, green check, DB confirmed
- Mark Card 2 → "Ready to practise?" CTA with bullseye SVG

**Blocker at session end:**
- /practice hits error boundary. Practice API route patch committed but not yet verified deployed.

**Key learnings:**
1. When API route calling an RPC fails silently, test the RPC in isolation before blaming auth — the 20+ turn "auth.getUser" detour was really a 1-turn type mismatch in `mark_card_read`.
2. `@supabase/ssr` 0.3.0 cookie-parsing bug affects both `auth.getUser` specifically and data queries broadly.
3. `assessment_questions` schema has NOT-NULL constraints on `question_type` (enum) and `acara_descriptor_code`.

---

## Manual Steps Before Launch

1. ~~Create GitHub repo~~ ✅ done
2. ~~Create Supabase project~~ ✅ done
3. ~~Run migrations 001 → 008~~ ✅ done (with live patches in Known Issues)
4. Create Stripe account → enable Stripe Connect
5. ~~Import repo to Vercel~~ ✅ done
6. Generate `CRON_SECRET`, `BADGE_SIGNING_SECRET`, `SESSION_TOKEN_SECRET` → Vercel
7. ~~Resend: verify teech.au domain~~ ✅ done → add `RESEND_API_KEY`
8. Solicitor sign-off → set `NEXT_PUBLIC_MARKETPLACE_LIVE=true`

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Apr 2026 | Year 9 Science as MVP | Tests all content types; pre-ATAR motivation |
| Apr 2026 | Supabase Sydney | Data sovereignty — student data never leaves Australia |
| Apr 2026 | Stripe Connect | PCI-DSS; GST-inclusive split payments native |
| Apr 2026 | No session recording by default | Privacy-first; opt-in only |
| Apr 2026 | 7 Platform Principles as code-level constraints | Non-negotiable |
| Apr 2026 | Zero emojis — pure CSS/SVG icons | Accessibility, consistency |
| Apr 2026 | Spectacles bold toggle on all screens | Hard-of-sight users |
| Apr 2026 | Structured logger (not console.log) | Machine-parseable by Vercel log drain |
| Apr 2026 | Auth trigger in Supabase | Guarantees profile creation atomically |
| Apr 2026 | Tutor marketplace gated by MARKETPLACE_LIVE flag | Deploy-safe |
| Apr 2026 | BUILD_PROGRESS.md is source of truth; Claude Projects copy is a mirror | Version-controlled, visible in git history |

---

## Dependency Versions (All Pinned — No Caret)

```
next:                  14.2.18
react:                 18.3.1
react-dom:             18.3.1
typescript:            5.4.5
@supabase/supabase-js: 2.43.4
@supabase/ssr:         0.3.0  ⚠️ known cookie bug — see Known Issues
@anthropic-ai/sdk:     0.24.3
stripe:                15.7.0
zod:                   3.23.8
date-fns:              3.6.0
clsx:                  2.1.1
tailwind-merge:        2.3.0
lucide-react:          0.383.0
crypto-js:             4.2.0
```
