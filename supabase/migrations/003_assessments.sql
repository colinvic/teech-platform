-- ============================================================
-- teech-platform Migration 003: Assessment Engine
-- ============================================================
-- Security principle: no two students see the same assessment.
-- Every session is time-limited, token-gated, and anomaly-scored.
-- ============================================================

create type assessment_status as enum (
  'pending', 'in_progress', 'completed_pass', 'completed_fail', 'flagged', 'expired'
);

create type question_type as enum (
  'multiple_choice', 'true_false', 'short_answer', 'ordering'
);

-- ── STUDENT SECTION PROGRESS ───────────────────────────────────────────────────

create table student_section_progress (
  id                        uuid primary key default gen_random_uuid(),
  student_id                uuid not null references profiles(id) on delete cascade,
  section_id                uuid not null references curriculum_sections(id),
  status                    section_status not null default 'locked',
  cards_viewed              int not null default 0 check (cards_viewed >= 0),
  cards_total               int not null default 0 check (cards_total >= 0),
  practice_attempts         int not null default 0 check (practice_attempts >= 0),
  practice_best_score       numeric(5,2) check (practice_best_score between 0 and 100),
  assessment_attempts       int not null default 0 check (assessment_attempts >= 0),
  assessment_best_score     numeric(5,2) check (assessment_best_score between 0 and 100),
  passed_at                 timestamptz,
  time_spent_seconds        int not null default 0 check (time_spent_seconds >= 0),
  last_activity_at          timestamptz not null default now(),
  created_at                timestamptz not null default now(),
  constraint student_section_progress_unique unique (student_id, section_id)
);

comment on table student_section_progress is 'Tracks each student''s progress through each curriculum section.';

-- ── SECTION FAIL FLAGS ─────────────────────────────────────────────────────────
-- Triggers tutor marketplace prompt after 2 failures

create table section_fail_flags (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references profiles(id) on delete cascade,
  section_id            uuid not null references curriculum_sections(id),
  fail_count            int not null default 0 check (fail_count >= 0),
  last_fail_at          timestamptz not null default now(),
  tutor_prompt_sent     boolean not null default false,
  tutor_prompt_sent_at  timestamptz,
  resolved              boolean not null default false,
  resolved_via          text check (resolved_via in ('session', 'self', 'dismissed')),
  constraint section_fail_flags_unique unique (student_id, section_id)
);

comment on table section_fail_flags is 'Tracks fail counts per student per section. At fail_count = 2, tutor prompt is triggered.';

-- ── ASSESSMENT SESSIONS ────────────────────────────────────────────────────────

create table assessment_sessions (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references profiles(id) on delete cascade,
  section_id            uuid not null references curriculum_sections(id),
  -- Security: each session has a unique, expiring token
  session_token         text not null unique default encode(gen_random_bytes(32), 'hex'),
  token_expires_at      timestamptz not null default (now() + interval '45 minutes'),
  status                assessment_status not null default 'pending',
  questions_total       int not null default 10,
  questions_answered    int not null default 0,
  questions_correct     int not null default 0,
  score_percentage      numeric(5,2) check (score_percentage between 0 and 100),
  -- Security: device fingerprinting to detect session sharing
  device_fingerprint    text not null,
  ip_address            inet not null,
  user_agent            text not null,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  -- Security: per-question timing — answers < 3s are flagged
  time_per_question_ms  int[] not null default '{}',
  -- Security: anomaly detection score 0-100; >70 = soft flag
  anomaly_score         numeric(5,2) not null default 0 check (anomaly_score between 0 and 100),
  flagged               boolean not null default false,
  flag_reason           text
);

comment on table assessment_sessions is 'Each assessment attempt. Never the same question set twice. Anomaly scoring on every session.';
comment on column assessment_sessions.session_token is 'Expires after 45 minutes. Invalid token = session rejected.';
comment on column assessment_sessions.device_fingerprint is 'Used to detect suspicious cross-device activity.';
comment on column assessment_sessions.anomaly_score is '0–100. Above 70: session flagged for review. Pass issued but internally marked pending.';

-- ── ASSESSMENT QUESTION BANK ───────────────────────────────────────────────────

create table assessment_questions (
  id                      uuid primary key default gen_random_uuid(),
  section_id              uuid not null references curriculum_sections(id) on delete cascade,
  question_type           question_type not null default 'multiple_choice',
  question_text           text not null check (char_length(question_text) between 10 and 2000),
  options                 jsonb,     -- [{key: 'a', text: '...'}, ...] — null for short_answer
  correct_answer          text not null,
  explanation             text not null,  -- always provided — honesty principle
  difficulty              int not null default 2 check (difficulty in (1, 2, 3)),
  acara_descriptor_code   text not null,
  generated_by_ai         boolean not null default true,
  reviewed_by_human       boolean not null default false,
  is_active               boolean not null default false,  -- must be reviewed before active
  created_at              timestamptz not null default now(),
  -- Ensure options exist for multiple_choice and true_false
  constraint questions_options_check check (
    (question_type in ('multiple_choice', 'true_false') and options is not null)
    or question_type in ('short_answer', 'ordering')
  )
);

comment on table assessment_questions is 'Question bank. AI-generated questions require human review before is_active = true.';
comment on column assessment_questions.reviewed_by_human is 'Honesty principle: AI-generated content is reviewed before student exposure.';

-- ── ASSESSMENT RESPONSES ───────────────────────────────────────────────────────

create table assessment_responses (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references assessment_sessions(id) on delete cascade,
  question_id     uuid not null references assessment_questions(id),
  student_answer  text not null,
  is_correct      boolean not null,
  time_taken_ms   int not null check (time_taken_ms >= 0),
  answered_at     timestamptz not null default now(),
  constraint assessment_responses_unique unique (session_id, question_id)
);

-- ── BADGES ─────────────────────────────────────────────────────────────────────

create type badge_rarity as enum (
  'standard', 'first_pass', 'perfect_score', 'fast_pass', 'streak'
);

create table badges (
  id                      uuid primary key default gen_random_uuid(),
  student_id              uuid not null references profiles(id) on delete cascade,
  section_id              uuid not null references curriculum_sections(id),
  assessment_session_id   uuid not null references assessment_sessions(id),
  rarity                  badge_rarity not null default 'standard',
  score_percentage        numeric(5,2) not null,
  issued_at               timestamptz not null default now(),
  -- Security: HMAC-SHA256 signature of badge data — unforgeable
  signature               text not null,
  verification_url        text not null,
  is_revoked              boolean not null default false,
  revoked_at              timestamptz,
  revoked_reason          text,
  -- One badge per student per section — can be upgraded to higher rarity
  constraint badges_student_section_unique unique (student_id, section_id)
);

comment on table badges is 'Cryptographically signed credentials. Signature = HMAC-SHA256(badge_id||student_id||section_id||issued_at, BADGE_SIGNING_SECRET).';
comment on column badges.verification_url is 'Public URL — no auth required. Anyone can verify badge authenticity.';

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table student_section_progress enable row level security;
alter table section_fail_flags enable row level security;
alter table assessment_sessions enable row level security;
alter table assessment_questions enable row level security;
alter table assessment_responses enable row level security;
alter table badges enable row level security;

-- Progress: student sees own; parent sees child's
create policy "student_section_progress_select"
  on student_section_progress for select
  using (
    auth.uid() = (select user_id from profiles where id = student_section_progress.student_id)
    or auth.uid() = (
      select user_id from profiles where id = (
        select parent_id from student_profiles where id = student_section_progress.student_id
      )
    )
  );

create policy "student_section_progress_insert_own"
  on student_section_progress for insert
  with check (auth.uid() = (select user_id from profiles where id = student_id));

create policy "student_section_progress_update_own"
  on student_section_progress for update
  using (auth.uid() = (select user_id from profiles where id = student_id));

-- Assessment sessions: student sees own only
create policy "assessment_sessions_select_own"
  on assessment_sessions for select
  using (auth.uid() = (select user_id from profiles where id = assessment_sessions.student_id));

create policy "assessment_sessions_insert_own"
  on assessment_sessions for insert
  with check (auth.uid() = (select user_id from profiles where id = student_id));

-- Questions: authenticated users can read active questions (served one at a time via API)
create policy "assessment_questions_select_active"
  on assessment_questions for select
  to authenticated
  using (is_active = true);

-- Responses: student sees own only
create policy "assessment_responses_select_own"
  on assessment_responses for select
  using (
    auth.uid() = (
      select user_id from profiles where id = (
        select student_id from assessment_sessions where id = assessment_responses.session_id
      )
    )
  );

-- Badges: student sees own; parent sees child's; public verification endpoint uses admin client
create policy "badges_select_own"
  on badges for select
  using (
    auth.uid() = (select user_id from profiles where id = badges.student_id)
    or auth.uid() = (
      select user_id from profiles where id = (
        select parent_id from student_profiles where id = badges.student_id
      )
    )
  );

-- ── INDEXES ────────────────────────────────────────────────────────────────────

create index idx_student_section_progress_student on student_section_progress(student_id);
create index idx_student_section_progress_status on student_section_progress(student_id, status);
create index idx_section_fail_flags_student on section_fail_flags(student_id);
create index idx_section_fail_flags_trigger on section_fail_flags(fail_count, tutor_prompt_sent) where fail_count >= 2 and tutor_prompt_sent = false;
create index idx_assessment_sessions_student on assessment_sessions(student_id);
create index idx_assessment_sessions_token on assessment_sessions(session_token);
create index idx_assessment_sessions_flagged on assessment_sessions(flagged) where flagged = true;
create index idx_assessment_questions_section on assessment_questions(section_id, is_active);
create index idx_assessment_responses_session on assessment_responses(session_id);
create index idx_badges_student on badges(student_id);
create index idx_badges_verification on badges(verification_url);
