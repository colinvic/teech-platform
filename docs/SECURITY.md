# teech-platform — Security Architecture

Security is Principle #1. This document is the single source of truth for all security decisions.

---

## Threat Model

| Threat | Risk | Mitigation |
|--------|------|------------|
| Student shares assessment with peers | HIGH | Dynamic question generation — no two sessions identical |
| Account sharing (parent takes test for child) | HIGH | Device fingerprinting, anomaly scoring, time-per-question analysis |
| Session token theft | MEDIUM | 45-min expiry, IP binding, one active session per account |
| Admin data breach | CRITICAL | 2FA required, audit log on all access, service role key never client-side |
| Student PII exposure | CRITICAL | RLS on all tables, data stays in Sydney, minimum-necessary API calls |
| Tutor profile fraud | HIGH | WWC hard gate, KYC via Stripe Identity, competency test before activation |
| Badge forgery | MEDIUM | HMAC-SHA256 signature, server-side only storage, live verification endpoint |
| Payment fraud | HIGH | Stripe handles all card data (PCI-DSS L1), webhook signature verification |
| XSS | MEDIUM | CSP headers, no dangerouslySetInnerHTML, Zod validation on all inputs |
| SQL injection | LOW | Supabase parameterised queries — no raw SQL from user input |

---

## Data Classification

| Classification | Examples | Storage | Access |
|---------------|----------|---------|--------|
| **CRITICAL** | Student PII, DOB, parent contact | Supabase Sydney only | RLS — own data only |
| **HIGH** | Assessment responses, badge data | Supabase Sydney only | RLS — own data only |
| **MEDIUM** | Tutor ABN, WWC numbers | Supabase Sydney only | RLS — own data only |
| **LOW** | Curriculum content, section names | Supabase Sydney | All authenticated users |
| **PUBLIC** | Badge verification page | Supabase — read via API | Unauthenticated |

---

## Authentication Security

- **Email + OTP** — No password-based auth. Removes password breach risk entirely.
- **One active session** — Login on Device B invalidates Device A's session.
- **Session token rotation** — Tokens rotate on every auth state change.
- **Under-18 accounts** — Cannot be created without linked parent account. Parental consent recorded with timestamp and IP.

---

## Assessment Anti-Cheat Stack

### Layer 1 — Question Uniqueness
Every assessment session draws from the question bank with randomised selection, randomised option order, and scenario variation via Claude. The probability of two students seeing identical question sets is negligible.

### Layer 2 — Session Tokens
```typescript
// Token generation — 32 bytes of cryptographic randomness
session_token = encode(gen_random_bytes(32), 'hex')
token_expires_at = now() + interval '45 minutes'
```
Every question request validates the token. Expired or missing tokens reject immediately.

### Layer 3 — Timing Analysis
Time per question is recorded in milliseconds. Questions answered in under 3 seconds are flagged. A session where >60% of questions are answered sub-3s scores 40+ on the anomaly scale.

### Layer 4 — Device Fingerprinting
Fingerprint components: user agent + screen resolution + timezone + canvas hash + WebGL hash. Change in fingerprint mid-session adds 30 to anomaly score.

### Layer 5 — Anomaly Scoring
```
anomaly_score = 0–100
> 70 → session flagged (pass issued but marked under_review internally)
> 90 → auto-suspend pending admin review
```
Flagged sessions appear in admin dashboard for human review.

### Layer 6 — Cooldown & Attempt Limits
- 24-hour cooldown after each fail
- Maximum 3 attempts → parent notification
- 3 flagged sessions on one account → parent verification required before next assessment

---

## Badge Security

```
signature = HMAC-SHA256(
  badge_id + '|' + student_id + '|' + section_id + '|' + issued_at_unix,
  BADGE_SIGNING_SECRET
)
```

Badges are stored server-side only. The student receives a URL, not a file. The verification endpoint recomputes the signature and compares — any tampering invalidates the badge immediately.

---

## API Security

Every API route:
1. Validates authentication (Supabase session)
2. Validates request body with Zod schema
3. Checks RLS implicitly via Supabase client
4. Logs to compliance_audit_log for sensitive operations
5. Returns typed ApiResponse — never raw errors to client

### Rate Limiting
- Assessment question endpoint: 60 requests/minute per session token
- Auth endpoints: 10 requests/minute per IP
- Claude API routes: 20 requests/minute per authenticated user

---

## Secrets Management

| Secret | Location | Rotation |
|--------|----------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (server-only) | Annually or on breach |
| `BADGE_SIGNING_SECRET` | Vercel env (server-only) | Annually — rotated badges are re-signed |
| `SESSION_TOKEN_SECRET` | Vercel env (server-only) | Annually |
| `STRIPE_SECRET_KEY` | Vercel env (server-only) | On breach |
| `ANTHROPIC_API_KEY` | Vercel env (server-only) | On breach |

**Rule:** Any secret visible in browser DevTools is a critical incident. Stop, rotate, investigate.

---

## Children's Privacy — Specific Controls

Per Privacy Act 1988 + anticipated Children's Online Privacy Code (Dec 2026):

- **Data minimisation:** Only collect data with a stated purpose. No collection "just in case."
- **No advertising profiling:** Student behavioural data is never used for advertising targeting — not by us, not by third parties.
- **Parental access:** Parent can request full data export for their child at any time. 30-day processing maximum.
- **Deletion:** Parent can request full account deletion. All PII deleted within 30 days. Audit log entries are anonymised (actor_id removed), not deleted.
- **Third-party processors:** Claude API, Stripe, Vercel are disclosed in the Privacy Policy. Student PII is minimised before any external API call.
