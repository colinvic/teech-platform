# teech-platform — Database Reference

**Engine:** PostgreSQL (Supabase)  
**Region:** ap-southeast-2 — Sydney, Australia  
**RLS:** Enabled on every table — no exceptions

---

## Migration Order

Run in sequence. Each migration is reversible (down migration in comments at end of file).

| File | Description |
|------|-------------|
| `001_auth_profiles.sql` | User profiles, student/parent/tutor extensions, parental consent |
| `002_curriculum.sql` | ACARA subjects, sections, content cards. Includes Year 9 Science seed data |
| `003_assessments.sql` | Progress tracking, assessment sessions, question bank, badges |
| `004_tutor_marketplace.sql` | WWC, availability, sessions, reviews, payouts |
| `005_audit_log.sql` | Compliance audit log (immutable), learning identity, report card cache |

---

## RLS Policy Summary

| Table | Student | Parent | Tutor | Admin |
|-------|---------|--------|-------|-------|
| profiles | Own only | Own only | Own only | All (audit logged) |
| student_profiles | Own only | Own child | — | All (audit logged) |
| curriculum_subjects | Read active | Read active | Read active | All |
| student_section_progress | Own only | Own child | — | All (audit logged) |
| assessment_sessions | Own only | — | — | All (audit logged) |
| assessment_questions | Read active | Read active | Read active | All |
| badges | Own only | Own child | — | Public verify endpoint |
| tutor_sessions | Own only | Own only | Own only | All (audit logged) |
| compliance_audit_log | — | — | — | Read only |

---

## Naming Conventions

- Tables: `snake_case` plural (e.g. `assessment_sessions`)
- Columns: `snake_case` (e.g. `student_id`)
- Foreign keys: `{table_singular}_id` (e.g. `section_id`)
- Enums: `snake_case` type names (e.g. `session_status`)
- Indexes: `idx_{table}_{column(s)}` (e.g. `idx_assessment_sessions_student`)
- Constraints: `{table}_{description}` (e.g. `badges_student_section_unique`)

---

## Key Constraints

- `badges`: One badge per student per section (`UNIQUE student_id, section_id`) — badges can be upgraded in rarity but not duplicated
- `student_section_progress`: One row per student per section
- `section_fail_flags`: One row per student per section — fail_count incremented on each fail
- `assessment_sessions`: Session token is unique — collision probability negligible (32 bytes random)
- `parental_consent_records`: Append-only — consent grants and withdrawals are both recorded

---

## Never Do

- Never delete from `compliance_audit_log` — it is an immutable record
- Never use raw SQL from user input — always use Supabase parameterised queries
- Never disable RLS on any table — use the admin client for service-level operations
- Never store card numbers, CVVs, or full bank account details — Stripe handles all payment data
- Never cache student PII in Redis or any edge cache — Supabase only
