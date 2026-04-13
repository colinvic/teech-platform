-- ============================================================
-- teech-platform Migration 008: Section Unlock Logic
-- ============================================================
-- Students start with the first section of each subject
-- unlocked. Subsequent sections unlock when the prior
-- section is passed (status = 'passed' or 'mastered').
--
-- This migration adds the function that determines which
-- sections should be available for a given student, and
-- seeds initial availability for new student profiles.
-- ============================================================

-- Function: unlock the next section after a pass
create or replace function unlock_next_section(
  p_student_id uuid,
  p_section_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject_id      uuid;
  v_current_order   int;
  v_next_section_id uuid;
begin
  -- Get the subject and order of the just-passed section
  select subject_id, order_in_subject
  into v_subject_id, v_current_order
  from curriculum_sections
  where id = p_section_id;

  -- Find the next section in the same subject
  select id into v_next_section_id
  from curriculum_sections
  where subject_id = v_subject_id
    and order_in_subject = v_current_order + 1
    and is_active = true;

  -- If there is a next section, mark it as available
  if v_next_section_id is not null then
    insert into student_section_progress (
      student_id,
      section_id,
      status,
      cards_total,
      last_activity_at
    )
    select
      p_student_id,
      v_next_section_id,
      'available',
      (select count(*) from section_cards where section_id = v_next_section_id),
      now()
    on conflict (student_id, section_id) do update
      set status = case
        -- Never downgrade a passed section
        when student_section_progress.status in ('passed', 'mastered') then student_section_progress.status
        -- Only unlock if currently locked
        when student_section_progress.status = 'locked' then 'available'
        else student_section_progress.status
      end;
  end if;
end;
$$;

comment on function unlock_next_section is
  'Called after a student passes a section. Unlocks the next sequential section in the same subject.';

-- Function: initialise progress for a new student
-- Seeds the first section of every active subject as 'available',
-- all subsequent sections as 'locked'.
create or replace function initialise_student_progress(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year_level year_level;
begin
  -- Get student's year level
  select year_level into v_year_level
  from student_profiles
  where id = p_student_id;

  if v_year_level is null then
    return;
  end if;

  -- For every active subject at this year level:
  -- Mark section order=1 as 'available', all others as 'locked'
  insert into student_section_progress (
    student_id, section_id, status, cards_total, last_activity_at
  )
  select
    p_student_id,
    cs.id,
    case when cs.order_in_subject = 1 then 'available'::section_status else 'locked'::section_status end,
    (select count(*) from section_cards sc where sc.section_id = cs.id),
    now()
  from curriculum_sections cs
  join curriculum_subjects subj on subj.id = cs.subject_id
  where subj.year_level = v_year_level
    and subj.is_active = true
    and cs.is_active = true
  on conflict (student_id, section_id) do nothing;
end;
$$;

comment on function initialise_student_progress is
  'Seeds section progress for a new student. First section of each subject = available, rest = locked.';

-- Function: get all sections with current student status
-- Used by the dashboard to render the curriculum map efficiently
create or replace function get_student_curriculum_map(
  p_student_id uuid,
  p_year_level year_level
)
returns table (
  section_id        uuid,
  subject_id        uuid,
  subject_name      text,
  learning_area     text,
  strand            text,
  section_name      text,
  slug              text,
  order_in_subject  int,
  estimated_minutes int,
  status            text,
  cards_viewed      int,
  cards_total       int,
  best_score        numeric
)
language sql
security definer
set search_path = public
as $$
  select
    cs.id                             as section_id,
    subj.id                           as subject_id,
    subj.name                         as subject_name,
    subj.learning_area                as learning_area,
    cs.strand                         as strand,
    cs.name                           as section_name,
    cs.slug                           as slug,
    cs.order_in_subject               as order_in_subject,
    cs.estimated_duration_minutes     as estimated_minutes,
    coalesce(ssp.status::text, 'locked') as status,
    coalesce(ssp.cards_viewed, 0)     as cards_viewed,
    coalesce(ssp.cards_total, 0)      as cards_total,
    ssp.assessment_best_score         as best_score
  from curriculum_sections cs
  join curriculum_subjects subj on subj.id = cs.subject_id
  left join student_section_progress ssp
    on ssp.section_id = cs.id
    and ssp.student_id = p_student_id
  where subj.year_level = p_year_level
    and subj.is_active = true
    and cs.is_active = true
  order by subj.learning_area, cs.order_in_subject;
$$;

comment on function get_student_curriculum_map is
  'Efficiently fetches full curriculum map with student progress for the dashboard.';
