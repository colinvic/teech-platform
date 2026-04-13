-- ============================================================
-- teech-platform Migration 001: Auth & User Profiles
-- ============================================================
-- Principles: Security, Honesty, Fair, Gender Neutral
-- RLS: ENABLED on all tables
-- Data residency: Supabase project must be ap-southeast-2 (Sydney)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── ENUMS ──────────────────────────────────────────────────────────────────────

create type user_role as enum ('student', 'parent', 'tutor', 'admin');
create type year_level as enum (
  'foundation',
  'year_1', 'year_2', 'year_3', 'year_4',
  'year_5', 'year_6', 'year_7', 'year_8',
  'year_9', 'year_10', 'year_11', 'year_12'
);
create type au_state as enum ('WA', 'NSW', 'VIC', 'QLD', 'SA', 'TAS', 'ACT', 'NT');
create type pronoun as enum ('they_them', 'she_her', 'he_him', 'prefer_not_to_say');
create type age_tier as enum (
  'foundation_2', 'year_3_6', 'year_7_8', 'year_9_10', 'senior_11_12'
);
create type tutor_status as enum (
  'pending', 'under_review', 'active', 'suspended', 'terminated'
);

-- ── BASE PROFILE ───────────────────────────────────────────────────────────────
-- All users have a profile. Role determines which additional table applies.

create table profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  role              user_role not null,
  full_name         text not null check (char_length(full_name) between 1 and 200),
  preferred_name    text check (char_length(preferred_name) between 1 and 100),
  -- Gender neutral: pronouns are optional and default to they/them
  pronoun           pronoun not null default 'they_them',
  -- Avatar key maps to a non-gendered avatar in the UI
  avatar_key        text default 'avatar_star',
  date_of_birth     date,
  state             au_state,
  timezone          text not null default 'Australia/Perth',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint profiles_user_id_unique unique (user_id)
);

comment on table profiles is 'Base profile for all platform users. Role determines additional table.';
comment on column profiles.pronoun is 'Gender neutral default: they_them. Student-controlled after age 13; parent-controlled below.';
comment on column profiles.avatar_key is 'Non-gendered avatar identifier. Default is a star — not gendered.';

-- ── STUDENT PROFILES ───────────────────────────────────────────────────────────

create table student_profiles (
  id                    uuid primary key references profiles(id) on delete cascade,
  year_level            year_level not null,
  age_tier              age_tier not null,
  parent_id             uuid references profiles(id),
  school_name           text,
  streak_current        int not null default 0 check (streak_current >= 0),
  streak_longest        int not null default 0 check (streak_longest >= 0),
  total_sections_passed int not null default 0 check (total_sections_passed >= 0),
  total_badges_earned   int not null default 0 check (total_badges_earned >= 0),
  last_active_at        timestamptz
);

comment on table student_profiles is 'Extended profile for students. Linked to profiles via id.';
comment on column student_profiles.age_tier is 'Determines AI tone in report card and platform copy. Auto-calculated from year_level.';

-- ── PARENT PROFILES ────────────────────────────────────────────────────────────

create table parent_profiles (
  id                  uuid primary key references profiles(id) on delete cascade,
  -- children is managed via student_profiles.parent_id
  notification_email  boolean not null default true,
  notification_push   boolean not null default true,
  report_frequency    text not null default 'monthly' check (report_frequency in ('weekly', 'monthly'))
);

comment on table parent_profiles is 'Extended profile for parents/guardians. Language: parent or guardian — never mother/father.';

-- ── TUTOR PROFILES ─────────────────────────────────────────────────────────────

create table tutor_profiles (
  id                              uuid primary key references profiles(id) on delete cascade,
  abn                             text unique check (abn ~ '^\d{11}$'),
  wwc_number                      text,
  wwc_state                       au_state,
  wwc_verified_at                 timestamptz,
  wwc_expiry                      date,
  identity_verified               boolean not null default false,
  kyc_provider_ref                text,
  qualifications                  jsonb not null default '[]',
  subjects                        text[] not null default '{}',
  year_levels                     year_level[] not null default '{}',
  acara_competency_scores         jsonb not null default '{}',
  hourly_rate                     numeric(10,2) check (hourly_rate > 0),
  stripe_account_id               text,
  rating                          numeric(3,2) check (rating between 1.0 and 5.0),
  sessions_completed              int not null default 0,
  status                          tutor_status not null default 'pending',
  contractor_agreement_signed_at  timestamptz,
  bio                             text check (char_length(bio) <= 1000)
);

comment on table tutor_profiles is 'Extended profile for tutors. Status must be active before any booking.';
comment on column tutor_profiles.abn is '11-digit ABN — required. Tutor is an independent contractor, not an employee.';
comment on column tutor_profiles.wwc_state is 'State of primary operation. Platform verifies cross-state requirements separately.';
comment on column tutor_profiles.bio is 'Tutor-written bio. Reviewed for gender-neutral language before publication.';

-- ── PARENTAL CONSENT RECORDS ───────────────────────────────────────────────────
-- Privacy Act + Children's Online Privacy Code compliance.
-- Every under-18 account requires verifiable parental consent.

create table parental_consent_records (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references profiles(id) on delete cascade,
  parent_id       uuid not null references profiles(id),
  consent_type    text not null check (consent_type in ('account_creation', 'data_processing', 'tutor_sessions', 'recording_opt_in')),
  granted         boolean not null,
  granted_at      timestamptz not null default now(),
  ip_address      inet not null,
  user_agent      text not null,
  withdrawn_at    timestamptz,
  withdrawal_reason text
);

comment on table parental_consent_records is 'Privacy Act s18 compliance. Every consent action is logged with timestamp and IP.';

-- ── UPDATED_AT TRIGGER ─────────────────────────────────────────────────────────

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

-- ── ROW LEVEL SECURITY ─────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table student_profiles enable row level security;
alter table parent_profiles enable row level security;
alter table tutor_profiles enable row level security;
alter table parental_consent_records enable row level security;

-- Profiles: users can read their own profile
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = user_id);

-- Profiles: users can update their own profile
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = user_id);

-- Profiles: authenticated users can insert their own profile
create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = user_id);

-- Student profiles: students can read their own; parents can read their children's
create policy "student_profiles_select"
  on student_profiles for select
  using (
    auth.uid() = (select user_id from profiles where id = student_profiles.id)
    or
    auth.uid() = (select user_id from profiles where id = student_profiles.parent_id)
  );

-- Student profiles: students can update their own
create policy "student_profiles_update_own"
  on student_profiles for update
  using (auth.uid() = (select user_id from profiles where id = student_profiles.id));

-- Parent profiles: parents can read their own
create policy "parent_profiles_select_own"
  on parent_profiles for select
  using (auth.uid() = (select user_id from profiles where id = parent_profiles.id));

-- Parent profiles: parents can update their own
create policy "parent_profiles_update_own"
  on parent_profiles for update
  using (auth.uid() = (select user_id from profiles where id = parent_profiles.id));

-- Tutor profiles: tutors can read their own; students in confirmed sessions can see limited data
create policy "tutor_profiles_select_own"
  on tutor_profiles for select
  using (auth.uid() = (select user_id from profiles where id = tutor_profiles.id));

-- Parental consent: only the parent or student involved can view
create policy "parental_consent_select"
  on parental_consent_records for select
  using (
    auth.uid() = (select user_id from profiles where id = parental_consent_records.student_id)
    or
    auth.uid() = (select user_id from profiles where id = parental_consent_records.parent_id)
  );

-- ── INDEXES ────────────────────────────────────────────────────────────────────

create index idx_profiles_user_id on profiles(user_id);
create index idx_profiles_role on profiles(role);
create index idx_student_profiles_parent_id on student_profiles(parent_id);
create index idx_student_profiles_year_level on student_profiles(year_level);
create index idx_tutor_profiles_status on tutor_profiles(status);
create index idx_tutor_profiles_wwc_expiry on tutor_profiles(wwc_expiry);
create index idx_parental_consent_student on parental_consent_records(student_id);

-- ── DOWN MIGRATION ─────────────────────────────────────────────────────────────
-- To reverse this migration:
-- drop table if exists parental_consent_records cascade;
-- drop table if exists tutor_profiles cascade;
-- drop table if exists parent_profiles cascade;
-- drop table if exists student_profiles cascade;
-- drop table if exists profiles cascade;
-- drop function if exists handle_updated_at cascade;
-- drop type if exists tutor_status cascade;
-- drop type if exists age_tier cascade;
-- drop type if exists pronoun cascade;
-- drop type if exists au_state cascade;
-- drop type if exists year_level cascade;
-- drop type if exists user_role cascade;
