// @ts-nocheck
/**
 * teech-platform â Claude API Client
 *
 * All Claude API calls go through this module.
 * Student PII is NEVER sent to Claude.
 * All prompts enforce gender-neutral language.
 * All generated content is labelled as AI-generated.
 */

import Anthropic from '@anthropic-ai/sdk'
import { GENDER_NEUTRAL } from './constants'
import type { AgeTier, CurriculumSection, LearningIdentityData } from '@/types/platform'

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
})

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000

// ââ Question Generation âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface GeneratedQuestion {
  question_text: string
  options: Array<{ key: string; text: string }>
  correct_answer: string
  explanation: string
  difficulty: 1 | 2 | 3
}

/**
 * Generate assessment questions for a curriculum section.
 * No student PII is included in this prompt.
 */
export async function generateQuestions(
  section: Pick<CurriculumSection, 'name' | 'acara_descriptor_code' | 'acara_descriptor_text' | 'strand'>,
  count: number = 10,
  difficulty: 1 | 2 | 3 = 2
): Promise<GeneratedQuestion[]> {
  const prompt = `You are an expert Australian curriculum educator writing assessment questions for ${section.name}.

ACARA Descriptor: ${section.acara_descriptor_code} â ${section.acara_descriptor_text}

Generate exactly ${count} multiple-choice questions at difficulty level ${difficulty}/3.
- Difficulty 1: foundational recall
- Difficulty 2: application and understanding  
- Difficulty 3: analysis and evaluation

Rules:
- Each question must have exactly 4 options (keys: a, b, c, d)
- One correct answer per question
- Distractors must be plausible â not obviously wrong
- Language must be clear and unambiguous
- Use Australian English spelling
- Gender-neutral language throughout â use "a student", "they", "their"
- Explanations must teach, not just state the answer

Return ONLY valid JSON â no preamble, no markdown fences:
{
  "questions": [
    {
      "question_text": "...",
      "options": [{"key": "a", "text": "..."}, {"key": "b", "text": "..."}, {"key": "c", "text": "..."}, {"key": "d", "text": "..."}],
      "correct_answer": "a",
      "explanation": "...",
      "difficulty": ${difficulty}
    }
  ]
}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content?.type !== 'text') {
    throw new Error('[teech] Claude returned non-text content for question generation')
  }

  const parsed = JSON.parse(content.text) as { questions: GeneratedQuestion[] }
  return parsed.questions
}

// ââ Session Brief Generation ââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Generate a tutor session brief from a student's gap data.
 * Input contains section data and error patterns ONLY â no student PII.
 */
export async function generateSessionBrief(params: {
  sectionName: string
  acaraDescriptor: string
  failCount: number
  lastScore: number | null
  commonErrorPattern: string | null
  suggestedFocusAreas: string[]
}): Promise<string> {
  const prompt = `You are preparing a session brief for an Australian curriculum tutor.

The student (referred to as "the student" â do not assume gender) has attempted this section ${params.failCount} times.

Section: ${params.sectionName}
ACARA Descriptor: ${params.acaraDescriptor}
Last attempt score: ${params.lastScore !== null ? `${params.lastScore}%` : 'Not available'}
Common error pattern: ${params.commonErrorPattern ?? 'Not yet identified'}
Suggested focus areas: ${params.suggestedFocusAreas.join(', ')}

Write a concise, practical tutor session brief (150â200 words) that:
1. Summarises what the student needs to understand to pass this section
2. Identifies the most likely conceptual gaps based on the error pattern
3. Suggests 2â3 specific teaching strategies for a 30-minute session
4. Uses Australian English
5. Is gender neutral throughout â never use he/she/his/her

Write directly â no preamble, no "Here is the brief:" introduction.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content?.type !== 'text') {
    throw new Error('[teech] Claude returned non-text content for session brief')
  }

  return content.text
}

// ââ Learning Identity Paragraph âââââââââââââââââââââââââââââââââââââââââââââââ

const AGE_TIER_TONE: Record<AgeTier, string> = {
  foundation_2: 'warm, encouraging, simple words, celebrate every win, use emoji sparingly',
  year_3_6: 'friendly, clear, motivating, age-appropriate vocabulary, positive and direct',
  year_7_8: 'honest and direct like a peer, acknowledge effort, do not patronise',
  year_9_10: 'analytical and respectful, treat them as capable of hearing real data about themselves',
  senior_11_12: 'coach-level, strategic, connect their learning patterns to their goals',
}

/**
 * Generate a monthly learning identity paragraph for the student report card.
 * No student name or PII is included. Tone is calibrated to age tier.
 */
export async function generateLearningIdentity(
  data: LearningIdentityData,
  ageTier: AgeTier
): Promise<string> {
  const tone = AGE_TIER_TONE[ageTier]

  const prompt = `You are writing a monthly learning identity paragraph for a student's report card on teech.au, an Australian learning platform.

Tone: ${tone}

Learning data for this month:
- Sections passed: ${data.sections_passed} of ${data.sections_attempted} attempted
- Strongest area: ${data.strongest_strand ?? 'not yet determined'}
- Area needing attention: ${data.weakest_strand ?? 'not yet determined'}
- Average attempts to pass a section: ${data.avg_attempts_to_pass.toFixed(1)}
- Consistency score: ${data.consistency_score}/100
- Current streak: ${data.streak_current} days
- Score improvement from first to final attempt: ${data.retry_improvement_rate.toFixed(0)}%
- Most productive time: ${data.peak_performance_day ?? 'not yet determined'}, ${data.peak_performance_hour !== null ? `${data.peak_performance_hour}:00` : 'time not determined'}
- Days since last session: ${data.days_since_last_session}

Write a single paragraph of 80â120 words that:
1. Describes THIS student's actual learning personality and patterns based on the data
2. Is specific â reference their actual strongest strand, consistency score, retry improvement
3. Ends with one honest, kind, specific nudge or encouragement
4. Uses "you" and "your" â address the student directly
5. Is completely gender neutral â never use he/she/his/her
6. Uses Australian English
7. Does NOT start with "You are" â vary the opening

Write only the paragraph â no title, no preamble.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content?.type !== 'text') {
    throw new Error('[teech] Claude returned non-text content for learning identity')
  }

  // Safety net: enforce gender-neutral language on output
  const { enforceGenderNeutral } = await import('./utils')
  return enforceGenderNeutral(content.text)
}

// ââ Error Pattern Analysis ââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Analyse a student's wrong answers to identify the likely conceptual gap.
 * Input: wrong answer texts only â no student identity.
 */
export async function analyseErrorPattern(params: {
  sectionName: string
  wrongAnswers: string[]
  correctAnswers: string[]
}): Promise<string> {
  const pairs = params.wrongAnswers
    .map((wrong, i) => `Student chose: "${wrong}" | Correct: "${params.correctAnswers[i] ?? 'unknown'}"`)
    .join('\n')

  const prompt = `An Australian curriculum student has been getting these questions wrong in ${params.sectionName}:

${pairs}

In one sentence (max 20 words), identify the likely conceptual misunderstanding. 
Be specific to the content â not generic advice like "needs more practice".
Use Australian English. Gender neutral.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 60,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content?.type !== 'text') return 'Pattern not identified'
  return content.text.trim()
}
