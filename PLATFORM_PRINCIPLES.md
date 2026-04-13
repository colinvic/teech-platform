# teech-platform — Platform Principles

These are not guidelines. They are the structural foundation of every decision made in this codebase. Every feature, every line of code, every piece of content is evaluated against all seven.

---

## 1. Security

Security is not a feature. It is the prerequisite for everything else.

**What this means in practice:**
- All student data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Row-Level Security enforced on every Supabase table — no exceptions
- One active session per account — concurrent sessions kill the prior session
- Device fingerprinting on all assessment sessions
- Assessment tokens expire after 45 minutes
- Tutor WWC checks verified before any profile activation — not after
- Compliance audit log records every data access by platform staff
- Admin access requires 2FA — always
- No student data ever leaves Australia (Supabase Sydney region)
- Third-party API calls (Claude, Stripe) use minimum-necessary data only
- All secrets in environment variables — never in code, never in logs

**Self-improvement rule:** If a new security vulnerability or better practice is identified during any build session, fix it immediately and document in the audit log. Do not defer security improvements.

---

## 2. Honesty

Every claim the platform makes must be true and provable. Every interaction must be genuine.

**What this means in practice:**
- AI-generated content (questions, learning identity paragraphs) is clearly labelled as AI-generated
- Tutor post-session pass rates are real data — not curated or cherry-picked
- No fake social proof — review counts are real, badge counts are real
- The platform never claims to guarantee academic outcomes
- Assessment difficulty is consistent — we do not make easier assessments when students struggle
- If a student fails, the platform says so clearly and kindly — not vaguely
- Learning identity paragraphs reflect actual behavioural data — not flattery
- Pricing is always fully disclosed before payment — including GST breakdown
- The platform never uses dark patterns to manipulate users into purchases

**Self-improvement rule:** If any content, metric, or claim in the platform is found to be misleading or ambiguous, correct it immediately — even if it was unintentional.

---

## 3. Build Quality

Every component is built as if it will serve a million students. No shortcuts, no tech debt left unaddressed.

**What this means in practice:**
- All TypeScript — no `any` types, no unsafe casts
- All database queries use typed returns — `.returns<T>()` on joins
- All dependencies pinned to exact versions — no caret (`^`) versioning
- Every migration is reversible (down migrations provided)
- Every API route has input validation (Zod schemas)
- Every component is mobile-first — designed at 375px, enhanced upward
- Lighthouse score target: 95+ on mobile for all core student flows
- No dead code committed — unused imports, components, or routes are removed
- Every environment variable has a corresponding `.env.example` entry
- CI/CD: tests must pass before any merge

**Self-improvement rule:** If you encounter a pattern, component, or function that can be improved while working on adjacent code, improve it and document what changed. Leave every file better than you found it.

---

## 4. Engaging

If a student is bored, we have failed. Learning should feel like the best game they played today.

**What this means in practice:**
- Sessions are designed for mobile attention spans: 5–15 minutes maximum per section
- Progress is always visible — students always know exactly where they are
- Streaks, badges, and milestones are celebrated — not hidden in a settings page
- The platform speaks to students like a smart, encouraging peer — not a teacher
- Wrong answers are treated as learning moments, never punishments
- Animations and micro-interactions reinforce progress — loading is never silent
- Content is visually rich — diagrams, infographics, interactive elements
- The curriculum map looks like a game world being unlocked
- Sound design (optional) reinforces positive moments
- The report card is the most interesting document a student receives about themselves

**Self-improvement rule:** If user session data shows drop-off at a specific point in any flow, investigate and redesign that step before moving to new features.

---

## 5. Transparent

Students and parents have the right to understand exactly how the platform works, what data it holds, and how decisions are made.

**What this means in practice:**
- Privacy policy is written in plain language — not legal boilerplate
- Every data point collected has a visible, stated purpose
- AI involvement in content generation is always disclosed
- Assessment scoring methodology is documented and accessible
- Tutor matching criteria are published (not a black box)
- Anti-cheat mechanisms are disclosed at a high level — students know sessions are monitored
- Parents can view all data held about their child on request
- Data deletion requests are processed within 30 days — no friction
- Platform revenue model is openly stated
- All compliance credentials are publicly displayed on the platform

**Self-improvement rule:** If a platform process is opaque to users, ask whether it needs to be. If not, document and expose it. Default to transparency.

---

## 6. Fair

Every student deserves the same quality of education regardless of postcode, background, family income, or academic starting point.

**What this means in practice:**
- Core learning content is accessible on the free tier — paywalls do not block education
- The platform works on low-end Android devices on 4G — not just premium iPhones on WiFi
- Content is reviewed for cultural bias annually — Australian diversity is reflected
- Indigenous Australian perspectives are included where curriculum-appropriate
- ESL students have access to simplified hint language (Phase 2)
- NDIS/accessibility features are built into the core — not an add-on (Phase 2)
- Tutor pricing is transparent — no hidden fees or premium tiers for better tutors
- The platform does not use student performance data to target advertising
- Scholarship/reduced-cost access is built into the revenue model from Phase 3

**Self-improvement rule:** If a feature, flow, or pricing decision systematically disadvantages any group of students, redesign it.

---

## 7. Gender Neutral

Language, imagery, and design never assume or reinforce gender.

**What this means in practice:**
- All AI-generated content uses "they/them" or restructured sentences — never "he" or "she" as default
- Student avatars are non-gendered by default — customisable but not binary
- Tutor profiles use "they/them" unless the tutor explicitly sets a pronoun preference
- Learning identity paragraphs use gender-neutral language at all times
- Illustrations and icons do not default to male or female stereotypes
- Subject associations are not gendered (science is for everyone — always)
- Parent/guardian language replaces "mother/father" in all system communications
- Form fields: "Title" is optional; "Name" does not assume format
- No assumptions about household structure in any copy

**Self-improvement rule:** Run a gender-neutral language audit on any new content before it ships. Flag and fix any assumption.

---

## The Meta-Rule

> **Every build session must leave teech-platform smarter, more secure, more capable, and more aligned to these principles than it found it. Improvement is not optional — it is the build.**
