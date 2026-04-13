-- ============================================================
-- teech-platform Migration 004: Tutor Marketplace
-- ============================================================
-- ⛔ LEGAL GATE: These tables are built now but MUST NOT be
-- activated (tutor onboarding opened) until the following
-- documents are signed off by a solicitor:
--   - Tutor Service Agreement
--   - Platform Terms of Service
--   - Privacy Policy
--   - Booking Terms & Refund Policy
-- ============================================================

create type session_status as enum (
  'pending', 'confirmed', 'in_progress', 'completed',
  'cancelled_parent', 'cancelled_tutor', 'no_show', 'disputed'
);

-- ── WWC VERIFICATIONS ──────────────────────────────────────────────────────────

create table wwc_verifications (
  id                    uuid primary key default gen_random_uuid(),
  tutor_id              uuid not null references profiles(id) on delete cascade,
  state                 au_state not null,
  wwc_number            text not null,
  verified_at           timestamptz not null,
  expiry_date           date not null,
  verification_source   text not null,
  raw_response          jsonb,       -- encrypted response from verification authority
  next_check_due        date not null,  -- expiry_date - 60 days
  created_at            timestamptz not null default now()
);

comment on table wwc_verifications is 'WWC verification record per tutor per state. Platform checks 60 days before expiry.';

-- ── TUTOR AVAILABILITY ────────────────────────────────────────────────────────

create table tutor_availability (
  id            uuid primary key default gen_random_uuid(),
  tutor_id      uuid not null references profiles(id) on delete cascade,
  day_of_week   int not null check (day_of_week between 0 and 6),  -- 0 = Sunday
  start_time    time not null,
  end_time      time not null,
  timezone      text not null default 'Australia/Perth',
  is_active     boolean not null default true,
  constraint tutor_availability_times_check check (end_time > start_time)
);

-- ── TUTOR SESSIONS ─────────────────────────────────────────────────────────────

create table tutor_sessions (
  id                        uuid primary key default gen_random_uuid(),
  tutor_id                  uuid not null references profiles(id),
  student_id                uuid not null references profiles(id),
  parent_id                 uuid not null references profiles(id),
  section_id                uuid not null references curriculum_sections(id),
  fail_count_at_booking     int not null check (fail_count_at_booking >= 0),
  -- AI-generated gap summary — uses minimum student data, no full history
  student_gap_summary       jsonb not null,
  scheduled_at              timestamptz not null,
  duration_minutes          int not null default 30 check (duration_minutes in (30, 60)),
  session_url               text,
  -- Privacy: recording is OFF by default — explicit opt-in required
  recording_consent         boolean not null default false,
  status                    session_status not null default 'pending',
  stripe_payment_intent_id  text,
  -- All amounts in cents (AUD)
  amount_total              int check (amount_total > 0),
  amount_gst                int check (amount_gst >= 0),
  platform_fee              int check (platform_fee >= 0),    -- 20%
  tutor_payout              int check (tutor_payout >= 0),    -- 80%
  completed_at              timestamptz,
  post_session_pass         boolean,
  post_session_score        numeric(5,2),
  created_at                timestamptz not null default now()
);

comment on table tutor_sessions is 'Each booked tutor session. recording_consent defaults to false — Privacy Act compliance.';
comment on column tutor_sessions.recording_consent is 'Both parent AND tutor must explicitly opt in. Default false. Never auto-enable.';
comment on column tutor_sessions.student_gap_summary is 'AI-generated gap summary sent to tutor. Contains section and error patterns only — no student PII.';

-- ── SESSION REVIEWS ────────────────────────────────────────────────────────────

create table session_reviews (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references tutor_sessions(id) on delete cascade,
  reviewer_type   text not null check (reviewer_type in ('parent', 'student')),
  reviewer_id     uuid not null references profiles(id),
  rating          int not null check (rating between 1 and 5),
  comment         text check (char_length(comment) <= 1000),
  -- Moderation: reviews held 24h before publication — defamation risk management
  moderated       boolean not null default false,
  moderated_at    timestamptz,
  published       boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint session_reviews_unique unique (session_id, reviewer_id)
);

comment on table session_reviews is '24-hour moderation hold before publication. Tutor right of reply: 7 days. Defamation risk management.';

-- ── PAYOUT RECORDS ─────────────────────────────────────────────────────────────

create table payout_records (
  id                  uuid primary key default gen_random_uuid(),
  tutor_id            uuid not null references profiles(id),
  session_id          uuid not null references tutor_sessions(id),
  stripe_transfer_id  text not null unique,
  gross_amount        int not null,     -- cents
  gst_component       int not null,     -- cents
  platform_fee        int not null,     -- cents (20%)
  net_to_tutor        int not null,     -- cents (80% minus GST if tutor GST registered)
  paid_at             timestamptz not null,
  tax_year            int not null,     -- e.g. 2026
  financial_year      text not null     -- e.g. '2025-26'
);

comment on table payout_records is 'Immutable payout record per session. Used for tutor annual tax summaries.';

-- ── RLS ────────────────────────────────────────────────────────────────────────

alter table wwc_verifications enable row level security;
alter table tutor_availability enable row level security;
alter table tutor_sessions enable row level security;
alter table session_reviews enable row level security;
alter table payout_records enable row level security;

-- WWC: tutor sees own only
create policy "wwc_select_own"
  on wwc_verifications for select
  using (auth.uid() = (select user_id from profiles where id = wwc_verifications.tutor_id));

-- Availability: tutor sees/manages own; authenticated users can view active availability for booking
create policy "tutor_availability_select_own"
  on tutor_availability for select
  using (auth.uid() = (select user_id from profiles where id = tutor_availability.tutor_id));

create policy "tutor_availability_select_active"
  on tutor_availability for select
  to authenticated
  using (is_active = true);

-- Sessions: tutor sees own; parent sees own; student sees own
create policy "tutor_sessions_select_tutor"
  on tutor_sessions for select
  using (auth.uid() = (select user_id from profiles where id = tutor_sessions.tutor_id));

create policy "tutor_sessions_select_parent"
  on tutor_sessions for select
  using (auth.uid() = (select user_id from profiles where id = tutor_sessions.parent_id));

create policy "tutor_sessions_select_student"
  on tutor_sessions for select
  using (auth.uid() = (select user_id from profiles where id = tutor_sessions.student_id));

-- Reviews: published reviews visible to authenticated; reviewer sees own unpublished
create policy "session_reviews_select_published"
  on session_reviews for select
  to authenticated
  using (published = true);

create policy "session_reviews_select_own"
  on session_reviews for select
  using (auth.uid() = (select user_id from profiles where id = session_reviews.reviewer_id));

-- Payouts: tutor sees own only
create policy "payout_records_select_own"
  on payout_records for select
  using (auth.uid() = (select user_id from profiles where id = payout_records.tutor_id));

-- ── INDEXES ────────────────────────────────────────────────────────────────────

create index idx_wwc_expiry_check on wwc_verifications(next_check_due);
create index idx_tutor_availability_tutor on tutor_availability(tutor_id, is_active);
create index idx_tutor_sessions_tutor on tutor_sessions(tutor_id, status);
create index idx_tutor_sessions_parent on tutor_sessions(parent_id);
create index idx_tutor_sessions_student on tutor_sessions(student_id);
create index idx_tutor_sessions_scheduled on tutor_sessions(scheduled_at) where status = 'confirmed';
create index idx_session_reviews_moderation on session_reviews(moderated, published, created_at);
create index idx_payout_records_tutor on payout_records(tutor_id, tax_year);
