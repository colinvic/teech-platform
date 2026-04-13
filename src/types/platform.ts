/**
 * teech-platform — Platform Types
 * Single source of truth for all TypeScript types.
 * Never use `any`. Never cast unsafely.
 * All database joins use intersection types — never cast as `any`.
 */

// ─────────────────────────────────────────────
// ENUMS & UNION TYPES
// ─────────────────────────────────────────────

export type UserRole = 'student' | 'parent' | 'tutor' | 'admin'

export type YearLevel =
  | 'foundation'
  | 'year_1' | 'year_2'
  | 'year_3' | 'year_4'
  | 'year_5' | 'year_6'
  | 'year_7' | 'year_8'
  | 'year_9' | 'year_10'
  | 'year_11' | 'year_12'

export type LearningArea =
  | 'english'
  | 'mathematics'
  | 'science'
  | 'humanities_social_sciences'
  | 'technologies'
  | 'health_pe'
  | 'arts'
  | 'languages'

export type ScienceStrand =
  | 'biological_sciences'
  | 'chemical_sciences'
  | 'physical_sciences'
  | 'earth_space_sciences'

export type SectionStatus = 'locked' | 'available' | 'in_progress' | 'passed' | 'mastered'

export type AssessmentStatus =
  | 'pending'
  | 'in_progress'
  | 'completed_pass'
  | 'completed_fail'
  | 'flagged'
  | 'expired'

export type TutorStatus = 'pending' | 'under_review' | 'active' | 'suspended' | 'terminated'

export type SessionStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled_parent'
  | 'cancelled_tutor'
  | 'no_show'
  | 'disputed'

export type BadgeRarity = 'standard' | 'first_pass' | 'perfect_score' | 'fast_pass' | 'streak'

export type AuState =
  | 'WA' | 'NSW' | 'VIC' | 'QLD' | 'SA' | 'TAS' | 'ACT' | 'NT'

export type Pronoun = 'they_them' | 'she_her' | 'he_him' | 'prefer_not_to_say'

// Age tiers — controls AI tone in report card and platform copy
export type AgeTier =
  | 'foundation_2'    // Foundation–Year 2: warm, encouraging, emoji-rich
  | 'year_3_6'        // Year 3–6: friendly, clear, motivating
  | 'year_7_8'        // Year 7–8: peer-like, honest, direct
  | 'year_9_10'       // Year 9–10: analytical, respectful, real
  | 'senior_11_12'    // Year 11–12: coach-level, strategic

// ─────────────────────────────────────────────
// USER PROFILES
// ─────────────────────────────────────────────

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  preferred_name: string | null
  pronoun: Pronoun
  avatar_key: string | null        // gender-neutral avatar identifier
  date_of_birth: string | null     // ISO date — used to calculate age tier
  state: AuState | null
  timezone: string                  // e.g. 'Australia/Perth'
  created_at: string
  updated_at: string
}

export interface StudentProfile extends Profile {
  role: 'student'
  year_level: YearLevel
  age_tier: AgeTier
  parent_id: string | null         // linked parent/guardian account
  school_name: string | null
  streak_current: number
  streak_longest: number
  total_sections_passed: number
  total_badges_earned: number
  last_active_at: string | null
}

export interface ParentProfile extends Profile {
  role: 'parent'
  children: string[]               // array of student profile IDs
  notification_email: boolean
  notification_push: boolean
  report_frequency: 'weekly' | 'monthly'
}

export interface TutorProfile extends Profile {
  role: 'tutor'
  abn: string
  wwc_number: string | null
  wwc_state: AuState | null
  wwc_verified_at: string | null
  wwc_expiry: string | null
  identity_verified: boolean
  qualifications: TutorQualification[]
  subjects: LearningArea[]
  year_levels: YearLevel[]
  acara_competency_scores: Record<string, number>  // sectionId → score
  hourly_rate: number
  stripe_account_id: string | null
  rating: number | null
  sessions_completed: number
  status: TutorStatus
  contractor_agreement_signed_at: string | null
  bio: string | null               // gender-neutral, written by tutor
}

export interface TutorQualification {
  institution: string
  degree: string
  year_completed: number
  verified: boolean
}

// ─────────────────────────────────────────────
// CURRICULUM
// ─────────────────────────────────────────────

export interface CurriculumSubject {
  id: string
  learning_area: LearningArea
  year_level: YearLevel
  name: string
  acara_code: string
  description: string
  is_active: boolean
  created_at: string
}

export interface CurriculumSection {
  id: string
  subject_id: string
  strand: string                   // e.g. 'biological_sciences'
  name: string
  slug: string
  acara_descriptor_code: string    // e.g. 'ACSSU175'
  acara_descriptor_text: string
  description: string
  estimated_duration_minutes: number
  order_in_subject: number
  is_active: boolean
  created_at: string
}

export interface SectionCard {
  id: string
  section_id: string
  card_type: 'text' | 'image' | 'diagram' | 'video' | 'interactive'
  title: string
  content: string                  // Markdown or HTML
  media_url: string | null
  alt_text: string | null          // accessibility — always required for images
  order_in_section: number
  reading_time_seconds: number
}

// ─────────────────────────────────────────────
// STUDENT PROGRESS
// ─────────────────────────────────────────────

export interface StudentSectionProgress {
  id: string
  student_id: string
  section_id: string
  status: SectionStatus
  cards_viewed: number
  cards_total: number
  practice_attempts: number
  practice_best_score: number | null
  assessment_attempts: number
  assessment_best_score: number | null
  passed_at: string | null
  time_spent_seconds: number
  last_activity_at: string
  created_at: string
}

export interface SectionFailFlag {
  id: string
  student_id: string
  section_id: string
  fail_count: number
  last_fail_at: string
  tutor_prompt_sent: boolean
  tutor_prompt_sent_at: string | null
  resolved: boolean
  resolved_via: 'session' | 'self' | 'dismissed' | null
}

// ─────────────────────────────────────────────
// ASSESSMENT ENGINE
// ─────────────────────────────────────────────

export interface AssessmentSession {
  id: string
  student_id: string
  section_id: string
  session_token: string            // expires after 45 minutes
  token_expires_at: string
  status: AssessmentStatus
  questions_total: number
  questions_answered: number
  questions_correct: number
  score_percentage: number | null
  device_fingerprint: string
  ip_address: string
  started_at: string
  completed_at: string | null
  time_per_question_ms: number[]   // array — one entry per question
  anomaly_score: number            // 0–100; >70 = flagged
  flagged: boolean
  flag_reason: string | null
}

export interface AssessmentQuestion {
  id: string
  section_id: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'ordering'
  question_text: string
  options: QuestionOption[] | null   // null for short_answer
  correct_answer: string
  explanation: string
  difficulty: 1 | 2 | 3
  acara_descriptor_code: string
  generated_by_ai: boolean
  reviewed_by_human: boolean
  created_at: string
}

export interface QuestionOption {
  key: string                      // 'a', 'b', 'c', 'd'
  text: string
}

export interface AssessmentResponse {
  id: string
  session_id: string
  question_id: string
  student_answer: string
  is_correct: boolean
  time_taken_ms: number
  answered_at: string
}

// ─────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────

export interface Badge {
  id: string
  student_id: string
  section_id: string
  assessment_session_id: string
  rarity: BadgeRarity
  score_percentage: number
  issued_at: string
  signature: string                // HMAC-SHA256 signed credential
  verification_url: string         // public, no auth required
  is_revoked: boolean
  revoked_at: string | null
  revoked_reason: string | null
}

export interface BadgeVerificationData {
  badge_id: string
  student_display_name: string     // preferred_name only — no surname
  section_name: string
  subject_name: string
  year_level: YearLevel
  score_percentage: number
  issued_at: string
  is_valid: boolean
  platform: 'teech.au'
}

// ─────────────────────────────────────────────
// REPORT CARD
// ─────────────────────────────────────────────

export interface LearningIdentity {
  id: string
  student_id: string
  period_month: number             // 1–12
  period_year: number
  generated_text: string           // Claude-generated, gender-neutral
  data_snapshot: LearningIdentityData
  generated_at: string
}

export interface LearningIdentityData {
  sections_passed: number
  sections_attempted: number
  strongest_strand: string | null
  weakest_strand: string | null
  avg_attempts_to_pass: number
  consistency_score: number        // 0–100
  peak_performance_day: string | null
  peak_performance_hour: number | null
  streak_current: number
  retry_improvement_rate: number   // % improvement from attempt 1 to final pass
  days_since_last_session: number
}

// ─────────────────────────────────────────────
// TUTOR MARKETPLACE
// ─────────────────────────────────────────────

export interface TutorAvailability {
  id: string
  tutor_id: string
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Sunday
  start_time: string               // HH:MM
  end_time: string                 // HH:MM
  timezone: string
  is_active: boolean
}

export interface TutorSession {
  id: string
  tutor_id: string
  student_id: string
  parent_id: string
  section_id: string
  fail_count_at_booking: number
  student_gap_summary: StudentGapSummary
  scheduled_at: string
  duration_minutes: number
  session_url: string | null
  recording_consent: boolean       // false by default — explicit opt-in only
  status: SessionStatus
  stripe_payment_intent_id: string | null
  amount_total: number             // in cents
  amount_gst: number               // in cents
  platform_fee: number             // in cents (20%)
  tutor_payout: number             // in cents (80%)
  completed_at: string | null
  post_session_pass: boolean | null
  post_session_score: number | null
  created_at: string
}

export interface StudentGapSummary {
  section_name: string
  acara_descriptor: string
  fail_count: number
  last_score: number | null
  common_error_pattern: string | null  // generated by Claude from wrong answers
  suggested_focus_areas: string[]
}

export interface SessionReview {
  id: string
  session_id: string
  reviewer_type: 'parent' | 'student'
  reviewer_id: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string | null
  moderated: boolean
  moderated_at: string | null
  published: boolean
  created_at: string
}

export interface PayoutRecord {
  id: string
  tutor_id: string
  session_id: string
  stripe_transfer_id: string
  gross_amount: number             // in cents
  gst_component: number            // in cents
  platform_fee: number             // in cents
  net_to_tutor: number             // in cents
  paid_at: string
  tax_year: number                 // e.g. 2026
  financial_year: string           // e.g. '2025-26'
}

// ─────────────────────────────────────────────
// COMPLIANCE & AUDIT
// ─────────────────────────────────────────────

export interface ComplianceAuditLog {
  id: string
  actor_id: string
  actor_role: UserRole | 'system'
  action: string
  table_name: string
  record_id: string
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  ip_address: string
  user_agent: string
  created_at: string
}

export interface WwcVerification {
  id: string
  tutor_id: string
  state: AuState
  wwc_number: string
  verified_at: string
  expiry_date: string
  verification_source: string
  next_check_due: string           // 60 days before expiry
}

// ─────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─────────────────────────────────────────────
// UTILITY TYPES
// ─────────────────────────────────────────────

// Use intersection types for database joins — never cast as `any`
export type SectionWithSubject = CurriculumSection & {
  subject: CurriculumSubject
}

export type StudentProgressWithSection = StudentSectionProgress & {
  section: SectionWithSubject
}

export type TutorSessionWithProfiles = TutorSession & {
  tutor: Pick<TutorProfile, 'id' | 'full_name' | 'preferred_name' | 'rating' | 'sessions_completed'>
  student: Pick<StudentProfile, 'id' | 'preferred_name' | 'year_level'>
  section: Pick<CurriculumSection, 'id' | 'name' | 'strand'>
}

export type BadgeWithSection = Badge & {
  section: SectionWithSubject
}
