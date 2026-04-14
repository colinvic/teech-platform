/**
 * teech-platform â Utility Functions
 * Gender neutral. Honest. No magic numbers â use constants.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { YEAR_LEVEL_TO_AGE_TIER, PLATFORM } from './constants'
import type { AgeTier, YearLevel, AuState } from '@/types/platform'

// ââ Tailwind class merging ââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ââ Year level helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function getAgeTier(yearLevel: YearLevel): AgeTier {
  const tier = YEAR_LEVEL_TO_AGE_TIER[yearLevel]
  if (!tier) throw new Error(`Unknown year level: ${yearLevel}`)
  return tier as AgeTier
}

// ââ Gender-neutral language helpers ââââââââââââââââââââââââââââââââââââââââââ

/**
 * Returns a gender-neutral possessive phrase.
 * e.g. getAgeTier â "their progress" not "his progress"
 */
export function genderNeutralPossessive(noun: string): string {
  return `their ${noun}`
}

/**
 * Replaces any gendered pronouns in text with gender-neutral alternatives.
 * Used as a safety net â AI prompts should already produce neutral language.
 */
export function enforceGenderNeutral(text: string): string {
  return text
    .replace(/\bhe\/she\b/gi, 'they')
    .replace(/\bhis\/her\b/gi, 'their')
    .replace(/\bhim\/her\b/gi, 'them')
    .replace(/\b(he|she)\b(?!'s)/g, 'they')
    .replace(/\b(his|her)\b/g, 'their')
    .replace(/\b(him)\b/g, 'them')
    .replace(/\bmother\b/gi, 'parent or guardian')
    .replace(/\bfather\b/gi, 'parent or guardian')
    .replace(/\bmum\b/gi, 'parent or guardian')
    .replace(/\bdad\b/gi, 'parent or guardian')
}

// ââ Formatting ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Format cents to AUD display string.
 * e.g. 4900 â "$49.00"
 */
export function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100)
}

/**
 * Calculate GST component from a GST-inclusive amount.
 */
export function calculateGST(amountIncGST: number): { gst: number; excGST: number } {
  const gst = Math.round(amountIncGST / 11)
  return { gst, excGST: amountIncGST - gst }
}

/**
 * Calculate tutor payout and platform fee from session amount.
 */
export function calculateSplit(amountCents: number): {
  tutorPayout: number
  platformFee: number
  gst: number
} {
  const { gst } = calculateGST(amountCents)
  const platformFee = Math.round(amountCents * 0.2)
  const tutorPayout = amountCents - platformFee
  return { tutorPayout, platformFee, gst }
}

// ââ Date helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function currentFinancialYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1  // 1-indexed
  // Australian financial year: 1 July â 30 June
  if (month >= 7) {
    return `${year}-${String(year + 1).slice(2)}`
  }
  return `${year - 1}-${String(year).slice(2)}`
}

export function currentTaxYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  return month >= 7 ? now.getFullYear() + 1 : now.getFullYear()
}

// ââ Assessment helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Calculate anomaly score for an assessment session.
 * Returns 0â100. Above 70 = flag for review.
 */
export function calculateAnomalyScore(params: {
  timePerQuestionMs: number[]
  ipChangedDuringSession: boolean
  deviceFingerprintChanged: boolean
  answersBeforeRender: number  // questions answered suspiciously fast
}): number {
  let score = 0

  // Fast answers are suspicious â threshold is 3000ms
  const fastAnswers = params.timePerQuestionMs.filter(t => t < 3000).length
  const totalAnswers = params.timePerQuestionMs.length
  if (totalAnswers > 0) {
    score += (fastAnswers / totalAnswers) * 40  // up to 40 points
  }

  if (params.ipChangedDuringSession) score += 20
  if (params.deviceFingerprintChanged) score += 30
  if (params.answersBeforeRender > 0) score += 30  // impossible answers

  return Math.min(100, Math.round(score))
}

// ââ WWC helpers âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Returns the WWC check name for a given Australian state.
 */
export function getWWCCheckName(state: AuState): string {
  const names: Record<AuState, string> = {
    WA: 'Working With Children Check',
    NSW: 'Working With Children Check',
    VIC: 'Working With Children Check',
    QLD: 'Blue Card',
    SA: 'WWCC',
    TAS: 'Registration to Work with Vulnerable People',
    ACT: 'Working with Vulnerable People Card',
    NT: 'Ochre Card',
  }
  return names[state]
}

/**
 * Returns the date when a WWC renewal alert should be sent (60 days before expiry).
 */
export function getWWCAlertDate(expiryDate: Date): Date {
  const alertDate = new Date(expiryDate)
  alertDate.setDate(alertDate.getDate() - 60)
  return alertDate
}

// ââ Slug helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ââ Type guards âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function isApiError(response: unknown): response is { success: false; error: string } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as Record<string, unknown>)['success'] === false
  )
}

// ââ Platform assertion âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Asserts that a value is defined (not null or undefined).
 * Use instead of non-null assertion operator `!`.
 */
export function assertDefined<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(`[${PLATFORM.NAME}] ${message}`)
  }
  return value
}

// ── Currency formatting ────────────────────────────────────────────────────────
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}
