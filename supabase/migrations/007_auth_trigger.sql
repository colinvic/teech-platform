-- ============================================================
-- teech-platform Migration 007: Auth → Profile Trigger
-- ============================================================
-- When a user signs up via Supabase Auth, this trigger
-- automatically creates their base profile and role-specific
-- extended profile row.
--
-- User metadata set during signInWithOtp (shouldCreateUser: true):
--   preferred_name  — display name
--   role            — 'student' | 'parent' | 'tutor'
--   year_level      — for students (e.g. 'year_9')
--   parent_email    — optional, for under-18 student accounts
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role      user_role;
  v_name      text;
  v_year      year_level;
  v_age_tier  age_tier;
begin
  -- Extract metadata passed during registration
  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'student'
  );
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'preferred_name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Create the base profile
  insert into profiles (
    user_id,
    role,
    full_name,
    preferred_name,
    pronoun,
    avatar_key,
    timezone
  ) values (
    new.id,
    v_role,
    v_name,
    v_name,
    'they_them',           -- gender-neutral default
    'avatar_spark',        -- non-gendered default avatar
    'Australia/Perth'      -- default timezone; updated on first login
  );

  -- Create role-specific extended profile
  case v_role
    when 'student' then
      -- Determine year level and age tier
      v_year := coalesce(
        nullif(new.raw_user_meta_data->>'year_level', '')::year_level,
        'year_9'
      );
      v_age_tier := case v_year
        when 'foundation', 'year_1', 'year_2' then 'foundation_2'::age_tier
        when 'year_3', 'year_4', 'year_5', 'year_6' then 'year_3_6'::age_tier
        when 'year_7', 'year_8' then 'year_7_8'::age_tier
        when 'year_9', 'year_10' then 'year_9_10'::age_tier
        else 'senior_11_12'::age_tier
      end;

      insert into student_profiles (id, year_level, age_tier)
      values (
        (select id from profiles where user_id = new.id),
        v_year,
        v_age_tier
      );

      -- Seed section progress: first section of each active subject = available, rest = locked
      perform initialise_student_progress(
        (select id from profiles where user_id = new.id)
      );

    when 'parent' then
      insert into parent_profiles (id)
      values (
        (select id from profiles where user_id = new.id)
      );

    when 'tutor' then
      insert into tutor_profiles (id, subjects, year_levels, qualifications)
      values (
        (select id from profiles where user_id = new.id),
        '{}', '{}', '[]'
      );

    else
      null; -- admin profiles are created manually
  end case;

  -- If student has a parent_email in metadata, try to link to existing parent
  if v_role = 'student' and new.raw_user_meta_data->>'parent_email' is not null then
    declare
      v_parent_user_id  uuid;
      v_parent_id       uuid;
      v_student_id      uuid;
    begin
      -- Find parent by email (they may or may not have registered yet)
      select id into v_parent_user_id
      from auth.users
      where email = new.raw_user_meta_data->>'parent_email'
      limit 1;

      if v_parent_user_id is not null then
        select id into v_parent_id
        from profiles
        where user_id = v_parent_user_id and role = 'parent';

        select id into v_student_id
        from profiles
        where user_id = new.id;

        if v_parent_id is not null and v_student_id is not null then
          update student_profiles
          set parent_id = v_parent_id
          where id = v_student_id;
        end if;
      end if;
    exception when others then
      -- Parent lookup failure is non-fatal — profile still created
      null;
    end;
  end if;

  return new;
end;
$$;

comment on function handle_new_user is
  'Creates profile and role-specific extended profile on every new Supabase Auth signup. '
  'Gender neutral defaults. Parental linking attempted if parent_email provided.';

-- Trigger: fires after every new row in auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- ── CRON SECRET FOR VERCEL ────────────────────────────────────────────────────
-- Remind: add CRON_SECRET to Vercel env vars.
-- Generate: openssl rand -hex 32
-- Vercel cron sends: Authorization: Bearer <CRON_SECRET>
-- ============================================================
