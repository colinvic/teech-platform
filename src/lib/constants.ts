// @ts-nocheck
/**
 * teech-platform â Platform Constants
 * Single source of truth for all magic numbers, strings, and brand values.
 */

// ââ Assessment rules ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export const ASSESSMENT = {
  PASS_THRESHOLD_PERCENT: 80,
  SESSION_EXPIRY_MINUTES: 45,
  MAX_ATTEMPTS_BEFORE_PARENT_NOTIFY: 3,
  COOLDOWN_HOURS_AFTER_FAIL: 24,
  TUTOR_TRIGGER_FAIL_COUNT: 2,
  ANOMALY_SCORE_THRESHOLD: 70,
  MAX_HINTS_PER_QUESTION: 2,
  FAST_ANSWER_THRESHOLD_MS: 3000,
} as const

// ââ Tutor marketplace âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export const MARKETPLACE = {
  PLATFORM_COMMISSION_PERCENT: 20,
  TUTOR_PAYOUT_PERCENT: 80,
  DEFAULT_SESSION_DURATION_MINUTES: 30,
  GST_RATE: 0.1,
  PAYOUT_DELAY_BUSINESS_DAYS: 7,
  CANCELLATION_FULL_REFUND_HOURS: 48,
  CANCELLATION_PARTIAL_REFUND_HOURS: 24,
  PARTIAL_REFUND_PERCENT: 50,
  TUTOR_ACCEPT_WINDOW_HOURS: 2,
  WWC_RENEWAL_ALERT_DAYS: 60,
  REVIEW_MODERATION_HOURS: 24,
  TUTOR_REPLY_WINDOW_DAYS: 7,
} as const

// ââ Streaks & engagement ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export const ENGAGEMENT = {
  STREAK_RESET_HOURS: 36,
  BURNOUT_SIGNAL_DAYS_INACTIVE: 5,
  PLATEAU_SIGNAL_WEEKS: 3,
} as const

// ââ Year levels âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export const YEAR_LEVEL_LABELS: Record<string, string> = {
  foundation: 'Foundation',
  year_1: 'Year 1', year_2: 'Year 2',
  year_3: 'Year 3', year_4: 'Year 4',
  year_5: 'Year 5', year_6: 'Year 6',
  year_7: 'Year 7', year_8: 'Year 8',
  year_9: 'Year 9', year_10: 'Year 10',
  year_11: 'Year 11', year_12: 'Year 12',
} as const

export const YEAR_LEVEL_TO_AGE_TIER: Record<string, string> = {
  foundation: 'foundation_2', year_1: 'foundation_2', year_2: 'foundation_2',
  year_3: 'year_3_6', year_4: 'year_3_6', year_5: 'year_3_6', year_6: 'year_3_6',
  year_7: 'year_7_8', year_8: 'year_7_8',
  year_9: 'year_9_10', year_10: 'year_9_10',
  year_11: 'senior_11_12', year_12: 'senior_11_12',
} as const

// ââ Australian states âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export const AU_STATES = ['WA', 'NSW', 'VIC', 'QLD', 'SA', 'TAS', 'ACT', 'NT'] as const

export const WWC_CHECK_NAMES: Record<string, string> = {
  WA:  'Working With Children Check',
  NSW: 'Working With Children Check',
  VIC: 'Working With Children Check',
  QLD: 'Blue Card',
  SA:  'WWCC',
  TAS: 'Registration to Work with Vulnerable People',
  ACT: 'Working with Vulnerable People Card',
  NT:  'Ochre Card',
} as const

// ââ Platform identity âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export const PLATFORM = {
  NAME:              'teech.au',
  FULL_NAME:         'teech.au â Australian Learning Platform',
  TAGLINE:           'Learn. Pass. Prove it.',
  OPERATOR:          'Flecco Group Pty Ltd ATF Flecco Family Trust',
  SUPPORT_EMAIL:     'support@teech.au',
  SAFETY_EMAIL:      'safety@teech.au',
  DATA_REGION:       'ap-southeast-2',
  DATA_REGION_LABEL: 'Sydney, Australia',
  CURRENCY:          'AUD',
  TIMEZONE_DEFAULT:  'Australia/Perth',
  DOMAINS:           ['teech.au', 'teech.com.au'],
} as const

// ââ Brand âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export const BRAND = {
  // The teech logo mark â 'ee' is the visual hook
  LOGO_TEXT:    'teech',
  LOGO_DOMAIN:  '.au',
  // Colour tokens (CSS var names)
  COLOR_PRIMARY:   '--teal',
  COLOR_SECONDARY: '--lime',
  COLOR_BADGE:     '--amber',
} as const

// ââ Gender-neutral defaults âââââââââââââââââââââââââââââââââââââââââââââââââââ
export const GENDER_NEUTRAL = {
  DEFAULT_PRONOUN:  'they/them',
  STUDENT_SINGULAR: 'student',
  PARENT_GUARDIAN:  'parent or guardian',
  TUTOR_REFERENCE:  'the tutor',
  AVATAR_DEFAULT:   'avatar_spark',
} as const
