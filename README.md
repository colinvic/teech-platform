# teech-platform

**teech.au** — Australia's mobile-first, ACARA-aligned learning platform with verified tutor marketplace.

> Learn. Pass. Prove it. — for every Australian student, everywhere.

---

## What teech.au does

Students work through curriculum sections aligned to the Australian Curriculum (ACARA Version 9). Each section is a focused micro-app:

| Mode | Purpose |
|------|---------|
| **Learn** | Mobile-optimised content cards |
| **Practice** | AI-adaptive questions with instant explanations |
| **Pass** | Anti-cheat assessment (80% threshold) |
| **Badge** | Cryptographically-signed, verifiable credential |

When a student fails a section twice, the **Tutor Marketplace** triggers — connecting them with a verified, subject-specific Australian tutor for a targeted 30-minute session.

---

## Brand

**teech** — the double 'e' is the hook. Distinctive, memorable, education-forward.

**Logo mark:** `te·ech.au` — the second 'e' is rendered in teal (`#14B8A6`)

**Palette:**
- Background: `#090E1A` (deep night)
- Primary: `#14B8A6` (teal — growth, clarity)
- Achievement: `#A3E635` (lime — energy, progress)
- Badges: `#FBBF24` (amber — achievement)

---

## Platform Principles

1. **Security** — Student data stays in Australia. RLS on everything.
2. **Honesty** — Every metric is real. No dark patterns.
3. **Build Quality** — TypeScript strict. Mobile-first. Pinned deps.
4. **Engaging** — Learning feels like the best app they used today.
5. **Transparent** — Students and parents understand everything.
6. **Fair** — Same quality education regardless of postcode.
7. **Gender Neutral** — Language, imagery, and design never assume gender.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14.2.18 |
| UI | React | 18.3.1 |
| Language | TypeScript | 5.4.5 |
| Database | Supabase (PostgreSQL — Sydney) | — |
| Payments | Stripe + Stripe Connect | 15.7.0 |
| AI | Anthropic Claude API | 0.24.3 |

---

## Getting Started

```bash
git clone https://github.com/colinvic/teech-platform
cd teech-platform
npm install
cp .env.example .env.local
# Fill in environment variables
npm run dev
```

---

## Operator

**Flecco Group Pty Ltd** ATF Flecco Family Trust · Perth, Western Australia

---

## Resume Prompt

> "Resume teech-platform build. Read BUILD_PROGRESS.md, identify first incomplete step, continue from there. Apply all 7 platform principles. Zero connection to any other Flecco platform."
