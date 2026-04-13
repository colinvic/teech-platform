-- ============================================================
-- teech-platform Migration 006: Database Functions & RPCs
-- ============================================================
-- These functions are called via supabase.rpc() from the app.
-- All are security-definer where they need elevated access.
-- ============================================================

-- ── Increment anomaly score on an assessment session ──────────────────────────

create or replace function increment_anomaly_score(session_id uuid, increment numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update assessment_sessions
  set anomaly_score = least(100, anomaly_score + increment)
  where id = session_id
    and status = 'in_progress';
end;
$$;

comment on function increment_anomaly_score is 'Increments anomaly score on a live assessment session. Capped at 100.';

-- ── Increment student badge count ─────────────────────────────────────────────

create or replace function increment_badge_count(student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update student_profiles
  set total_badges_earned = total_badges_earned + 1
  where id = student_id;
end;
$$;

comment on function increment_badge_count is 'Atomically increments total_badges_earned on student_profiles.';

-- ── Increment section pass count ──────────────────────────────────────────────

create or replace function increment_pass_count(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update student_profiles
  set total_sections_passed = total_sections_passed + 1
  where id = p_student_id;
end;
$$;

-- ── Update student streak ─────────────────────────────────────────────────────
-- Called daily by cron. Resets streak if inactive > 36 hours.

create or replace function update_student_streak(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_active timestamptz;
  v_hours_since float;
  v_current_streak int;
  v_longest_streak int;
begin
  select last_active_at, streak_current, streak_longest
  into v_last_active, v_current_streak, v_longest_streak
  from student_profiles
  where id = p_student_id;

  if v_last_active is null then
    return jsonb_build_object('streak', 0, 'action', 'no_activity');
  end if;

  v_hours_since := extract(epoch from (now() - v_last_active)) / 3600;

  -- 36-hour window: if they studied yesterday and today counts as active
  if v_hours_since > 36 then
    update student_profiles
    set streak_current = 0
    where id = p_student_id;
    return jsonb_build_object('streak', 0, 'action', 'reset');
  end if;

  -- Active within window — streak continues
  return jsonb_build_object('streak', v_current_streak, 'action', 'maintained');
end;
$$;

-- ── Refresh report card cache ─────────────────────────────────────────────────
-- Called monthly by cron. Aggregates all student metrics.

create or replace function refresh_report_card_cache(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consistency float;
  v_avg_attempts float;
  v_retry_improvement float;
  v_strongest_strand text;
  v_weakest_strand text;
  v_days_active int;
  v_sections_passed_month int;
begin
  -- Consistency score: active days in last 30 days / 30 * 100
  select count(distinct date_trunc('day', last_activity_at))::float / 30 * 100
  into v_days_active
  from student_section_progress
  where student_id = p_student_id
    and last_activity_at >= now() - interval '30 days';

  v_consistency := least(100, coalesce(v_days_active, 0)::float / 30 * 100);

  -- Average attempts to pass
  select avg(assessment_attempts)
  into v_avg_attempts
  from student_section_progress
  where student_id = p_student_id
    and status in ('passed', 'mastered')
    and assessment_attempts > 0;

  -- Sections passed this month
  select count(*)
  into v_sections_passed_month
  from student_section_progress
  where student_id = p_student_id
    and status in ('passed', 'mastered')
    and passed_at >= date_trunc('month', now());

  -- Days active this month
  select count(distinct date_trunc('day', last_activity_at))
  into v_days_active
  from student_section_progress
  where student_id = p_student_id
    and last_activity_at >= date_trunc('month', now());

  -- Strongest strand: strand with most passes
  select cs.strand
  into v_strongest_strand
  from student_section_progress ssp
  join curriculum_sections cs on cs.id = ssp.section_id
  where ssp.student_id = p_student_id
    and ssp.status in ('passed', 'mastered')
  group by cs.strand
  order by count(*) desc
  limit 1;

  -- Weakest strand: strand with most fails, no pass
  select cs.strand
  into v_weakest_strand
  from student_section_progress ssp
  join curriculum_sections cs on cs.id = ssp.section_id
  where ssp.student_id = p_student_id
    and ssp.status = 'in_progress'
    and ssp.assessment_attempts > 0
  group by cs.strand
  order by count(*) desc
  limit 1;

  -- Upsert cache
  insert into report_card_cache (
    student_id, consistency_score, avg_attempts_to_pass,
    retry_improvement, strongest_strand, weakest_strand,
    days_active_this_month, sections_passed_this_month, calculated_at
  ) values (
    p_student_id, v_consistency, coalesce(v_avg_attempts, 1.0),
    0, v_strongest_strand, v_weakest_strand,
    v_days_active, v_sections_passed_month, now()
  )
  on conflict (student_id) do update set
    consistency_score = excluded.consistency_score,
    avg_attempts_to_pass = excluded.avg_attempts_to_pass,
    strongest_strand = excluded.strongest_strand,
    weakest_strand = excluded.weakest_strand,
    days_active_this_month = excluded.days_active_this_month,
    sections_passed_this_month = excluded.sections_passed_this_month,
    calculated_at = now();
end;
$$;

-- ── Mark card as read ─────────────────────────────────────────────────────────

create or replace function mark_card_read(
  p_student_id uuid,
  p_section_id uuid,
  p_cards_viewed int,
  p_cards_total int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_status text;
begin
  v_new_status := case
    when p_cards_viewed >= p_cards_total and p_cards_total > 0 then 'in_progress'
    else 'in_progress'
  end;

  insert into student_section_progress (
    student_id, section_id, status,
    cards_viewed, cards_total, last_activity_at
  ) values (
    p_student_id, p_section_id, v_new_status,
    p_cards_viewed, p_cards_total, now()
  )
  on conflict (student_id, section_id) do update set
    cards_viewed = greatest(student_section_progress.cards_viewed, excluded.cards_viewed),
    cards_total = excluded.cards_total,
    status = case
      when student_section_progress.status in ('passed', 'mastered') then student_section_progress.status
      else excluded.status
    end,
    last_activity_at = now();

  -- Update last_active_at on student profile
  update student_profiles
  set last_active_at = now()
  where id = p_student_id;
end;
$$;

comment on function mark_card_read is 'Upserts progress. Never downgrades a passed section. Updates last_active_at.';

-- ── Get tutor fail prompt (used by notification system) ───────────────────────

create or replace function get_students_needing_tutor_prompt()
returns table (
  student_id uuid,
  section_id uuid,
  fail_count int,
  parent_id uuid,
  student_name text,
  section_name text
)
language sql
security definer
set search_path = public
as $$
  select
    sff.student_id,
    sff.section_id,
    sff.fail_count,
    sp.parent_id,
    p.preferred_name,
    cs.name
  from section_fail_flags sff
  join student_profiles sp on sp.id = sff.student_id
  join profiles p on p.id = sff.student_id
  join curriculum_sections cs on cs.id = sff.section_id
  where sff.fail_count >= 2
    and sff.tutor_prompt_sent = false
    and sff.resolved = false
    and sp.parent_id is not null;
$$;
