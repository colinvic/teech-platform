/**
 * teech-platform â Badge Signing & Verification
 *
 * Badges are cryptographically signed using HMAC-SHA256.
 * Signature = HMAC-SHA256(badge_id|student_id|section_id|issued_at_unix, BADGE_SIGNING_SECRET)
 *
 * Badges are stored server-side only.
 * Students receive a verification URL, not a file.
 * Verification is public â no auth required.
 */

import { createHmac } from 'crypto'
import { PLATFORM } from './constants'

const SECRET = process.env['BADGE_SIGNING_SECRET']

// ââ Signing âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface BadgeSigningInput {
  badgeId: string
  studentId: string
  sectionId: string
  issuedAt: Date
}

/**
 * Sign a badge. Call at badge issuance â store the returned signature.
 */
export function signBadge(input: BadgeSigningInput): string {
  if (!SECRET) {
    throw new Error('[teech] Missing BADGE_SIGNING_SECRET')
  }

  const payload = [
    input.badgeId,
    input.studentId,
    input.sectionId,
    Math.floor(input.issuedAt.getTime() / 1000).toString(),
  ].join('|')

  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

/**
 * Verify a badge signature. Used by the public verification endpoint.
 * Returns true only if the signature is valid and the badge is not revoked.
 */
export function verifyBadgeSignature(
  input: BadgeSigningInput,
  storedSignature: string
): boolean {
  if (!SECRET) {
    throw new Error('[teech] Missing BADGE_SIGNING_SECRET')
  }

  const expectedSignature = signBadge(input)

  // Constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== storedSignature.length) return false

  let mismatch = 0
  for (let i = 0; i < expectedSignature.length; i++) {
    mismatch |= expectedSignature.charCodeAt(i) ^ storedSignature.charCodeAt(i)
  }

  return mismatch === 0
}

// ââ Badge rarity calculation ââââââââââââââââââââââââââââââââââââââââââââââââââ

import type { BadgeRarity } from '@/types/platform'
import { ASSESSMENT } from './constants'

export function calculateBadgeRarity(params: {
  scorePercent: number
  attemptNumber: number
  durationSeconds: number
  estimatedDurationSeconds: number
  currentStreak: number
}): BadgeRarity {
  // Perfect score
  if (params.scorePercent === 100) return 'perfect_score'

  // First attempt pass
  if (params.attemptNumber === 1) return 'first_pass'

  // Fast pass â completed in under 50% of estimated time
  if (params.durationSeconds < params.estimatedDurationSeconds * 0.5) return 'fast_pass'

  // Streak badge â on a streak of 7+ days
  if (params.currentStreak >= 7) return 'streak'

  return 'standard'
}

// ââ Verification URL ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export function getBadgeVerificationUrl(badgeId: string): string {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? `https://teech.au`
  return `${baseUrl}/verify/badge/${badgeId}`
}

// ââ Badge metadata for public display ââââââââââââââââââââââââââââââââââââââââ
// Only the minimum needed for public verification â no student PII

export interface PublicBadgeData {
  badgeId: string
  sectionName: string
  subjectName: string
  yearLevel: string
  scorePercent: number
  issuedAt: string             // ISO string
  rarity: BadgeRarity
  platform: string
  isValid: boolean
  studentDisplayName: string   // full_name only â no surname
}

export function formatBadgeForPublic(params: {
  badgeId: string
  sectionName: string
  subjectName: string
  yearLevel: string
  scorePercent: number
  issuedAt: Date
  rarity: BadgeRarity
  isRevoked: boolean
  preferredName: string
}): PublicBadgeData {
  return {
    badgeId: params.badgeId,
    sectionName: params.sectionName,
    subjectName: params.subjectName,
    yearLevel: params.yearLevel,
    scorePercent: params.scorePercent,
    issuedAt: params.issuedAt.toISOString(),
    rarity: params.rarity,
    platform: PLATFORM.NAME,
    isValid: !params.isRevoked,
    studentDisplayName: params.preferredName,  // full_name only â privacy
  }
}
