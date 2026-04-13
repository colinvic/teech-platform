# teech-platform — API Reference

All API routes are under `/api/`. All routes require authentication via Supabase session cookie unless marked **Public**.

---

## Authentication

### `POST /api/auth/callback`
Supabase OAuth callback. Exchanges auth code for session.

---

## Assessment

### `POST /api/assessment/start`
Start a new assessment session for a section.

**Body**
```json
{ "sectionId": "uuid", "deviceFingerprint": "string" }
```
**Returns** `{ sessionId, token, expiresAt }`  
**Errors** `COOLDOWN_ACTIVE` (429), `UNAUTHORISED` (401)

---

### `POST /api/assessment/question`
Fetch the next question in an active session. One question at a time — never batched.

**Body**
```json
{ "sessionId": "uuid", "token": "string", "questionIndex": 0 }
```
**Returns** `{ index, questionText, questionType, options, totalQuestions, timeRemainingSeconds }`  
**Security** Token validated on every call. Question IDs never exposed to client.

---

### `POST /api/assessment/submit`
Submit all answers and complete the session. Issues badge on pass.

**Body**
```json
{
  "sessionId": "uuid",
  "token": "string",
  "answers": [{ "questionIndex": 0, "selectedKey": "a", "timeMs": 4200 }],
  "deviceFingerprint": "string"
}
```
**Returns** `{ passed, scorePercent, correctCount, totalQuestions, badgeId?, verificationUrl?, message }`

---

## Practice

### `GET /api/practice/questions?slug=<section-slug>`
Returns up to 10 shuffled active questions for practice mode. No session token required — practice is unlimited and unscored.

---

## Sections

### `GET /api/sections/info?slug=<section-slug>`
Returns section metadata plus the student's current fail count and last fail timestamp (used by assess page to enforce cooldown).

---

## Progress

### `POST /api/progress/card-read`
Form POST. Marks a content card as read and updates section progress.  
**Body (form-data)** `sectionId`, `cardsViewed`, `cardsTotal`

---

## Badges

### `GET /api/badges/verify` — **Public**
Verify a badge by ID for the public verification page.  
Used internally by `verify/badge/[id]/page.tsx`.

---

## Claude (Admin only)

### `POST /api/claude/questions`
Generate a batch of AI questions for a section. Questions are inserted as `is_active: false` pending human review.

**Body** `{ "sectionId": "uuid", "difficulty": 1|2|3, "count": 15 }`

---

### `POST /api/claude/identity`
Generate a monthly learning identity paragraph for a student.

**Body** `{ "studentId": "uuid", "month": 1-12, "year": 2026 }`

---

## Stripe

### `POST /api/stripe/checkout`
Create a Stripe checkout session for a tutor booking.  
**Body** `{ "tutorSessionId": "uuid" }`  
**Returns** `{ url }` — redirect parent to Stripe checkout

---

### `POST /api/stripe/webhook`
Stripe webhook receiver. Verifies HMAC signature before processing.  
**Headers** `stripe-signature: <webhook-sig>`

---

## Admin

### `POST /api/admin/questions/approve`
Approve an AI-generated question (sets `is_active: true`, `reviewed_by_human: true`).  
**Body (form-data)** `questionId`

### `POST /api/admin/questions/reject`
Reject an AI-generated question (sets `reviewed_by_human: true`, `is_active: false`).  
**Body (form-data)** `questionId`

---

## Cron (Vercel Cron — internal)

All cron routes require `Authorization: Bearer <CRON_SECRET>` header.

| Route | Schedule | Action |
|-------|----------|--------|
| `GET /api/cron/report-card-refresh` | 1st of month, 02:00 | Recalculate all student report card caches |
| `GET /api/cron/learning-identity` | 2nd of month, 02:00 | Generate monthly AI learning identity paragraphs |
| `GET /api/cron/wwc-expiry-check` | Daily 08:00 | Alert tutors with expiring WWC; suspend expired |
| `GET /api/cron/streak-check` | Daily 00:01 | Reset streaks for students inactive > 36 hours |
| `GET /api/cron/publish-reviews` | Every hour | Publish moderated reviews older than 24 hours |
| `GET /api/cron/tutor-prompt` | Daily 09:00 | Email parents when student fails a section twice |

---

## Response Format

All routes return `ApiResponse<T>`:

```typescript
// Success
{ "success": true, "data": T }

// Error
{ "success": false, "error": "Human-readable message", "code": "MACHINE_CODE" }
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| `UNAUTHORISED` | No valid session |
| `VALIDATION_ERROR` | Request body failed Zod schema |
| `NOT_FOUND` | Resource does not exist |
| `COOLDOWN_ACTIVE` | Assessment cooldown period in effect |
| `SESSION_EXPIRED` | Assessment session token has expired |
| `INVALID_SESSION` | Token does not match session |
| `NO_QUESTIONS` | No active questions for this section |
| `INTERNAL_ERROR` | Unhandled server error |
