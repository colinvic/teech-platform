'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/card'
import { ASSESSMENT } from '@/lib/constants'

interface AssessPageProps {
  params: Promise<{ slug: string }>
}

type Phase =
  | 'pre_check'
  | 'in_progress'
  | 'submitting'
  | 'result_pass'
  | 'result_fail'
  | 'error'
  | 'cooldown'

interface ClientQuestion {
  index: number
  questionText: string
  questionType: string
  options: Array<{ key: string; text: string }> | null
  totalQuestions: number
  timeRemainingSeconds: number
}

interface Answer {
  questionIndex: number
  selectedKey: string
  timeMs: number
}

interface SubmitResult {
  passed: boolean
  scorePercent: number
  correctCount: number
  totalQuestions: number
  badgeId?: string
  verificationUrl?: string
  message: string
}

// Device fingerprint — client-side only, non-PII
function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr'
  const components = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    String(navigator.hardwareConcurrency ?? 0),
  ]
  // Simple hash of components
  let hash = 0
  const str = components.join('|')
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export default function AssessPage({ params }: AssessPageProps) {
  const [slug, setSlug] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [phase, setPhase] = useState<Phase>('pre_check')
  const [sessionId, setSessionId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState<ClientQuestion | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(ASSESSMENT.SESSION_EXPIRY_MINUTES * 60)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldownHours, setCooldownHours] = useState(24)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fingerprint = useRef(getDeviceFingerprint())

  useEffect(() => {
    params.then(({ slug: s }) => {
      setSlug(s)
      fetchSectionInfo(s)
    })
  }, [params])

  // Countdown timer
  useEffect(() => {
    if (phase !== 'in_progress') return
    timerRef.current = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          void handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  // Security: disable right-click and text selection during assessment
  useEffect(() => {
    if (phase !== 'in_progress') return
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('selectstart', prevent)
    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('selectstart', prevent)
    }
  }, [phase])

  async function fetchSectionInfo(sectionSlug: string) {
    const res = await fetch(`/api/sections/info?slug=${sectionSlug}`)
    const data = await res.json() as { success: boolean; data?: { id: string; name: string; attempts: number; lastFailAt: string | null } }
    if (data.success && data.data) {
      setSectionId(data.data.id)
      setSectionName(data.data.name)

      // Check cooldown
      if (data.data.lastFailAt) {
        const hoursSince = (Date.now() - new Date(data.data.lastFailAt).getTime()) / 3600000
        if (hoursSince < ASSESSMENT.COOLDOWN_HOURS_AFTER_FAIL) {
          setCooldownHours(Math.ceil(ASSESSMENT.COOLDOWN_HOURS_AFTER_FAIL - hoursSince))
          setPhase('cooldown')
          return
        }
      }
    }
  }

  async function startSession() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/assessment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, deviceFingerprint: fingerprint.current }),
      })
      const data = await res.json() as { success: boolean; data?: { sessionId: string; token: string }; error?: string; code?: string }

      if (!data.success) {
        if (data.code === 'COOLDOWN_ACTIVE') {
          setPhase('cooldown')
        } else {
          setError(data.error ?? 'Could not start session')
          setPhase('error')
        }
        return
      }

      setSessionId(data.data!.sessionId)
      setSessionToken(data.data!.token)
      setTimeRemaining(ASSESSMENT.SESSION_EXPIRY_MINUTES * 60)
      setAnswers([])
      setPhase('in_progress')
      await loadQuestion(data.data!.sessionId, data.data!.token, 0)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestion = useCallback(async (sid: string, tok: string, index: number) => {
    const res = await fetch('/api/assessment/question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-fingerprint': fingerprint.current,
      },
      body: JSON.stringify({ sessionId: sid, token: tok, questionIndex: index }),
    })
    const data = await res.json() as { success: boolean; data?: ClientQuestion; error?: string }
    if (data.success && data.data) {
      setCurrentQuestion(data.data)
      setSelectedKey(null)
      setQuestionStartTime(Date.now())
    }
  }, [])

  async function handleAnswerSubmit() {
    if (!selectedKey || !currentQuestion) return

    const timeMs = Date.now() - questionStartTime
    const newAnswers = [...answers, {
      questionIndex: currentQuestion.index,
      selectedKey,
      timeMs,
    }]
    setAnswers(newAnswers)

    const nextIndex = currentQuestion.index + 1
    if (nextIndex >= currentQuestion.totalQuestions) {
      await handleSubmit(false, newAnswers)
    } else {
      await loadQuestion(sessionId, sessionToken, nextIndex)
    }
  }

  const handleSubmit = useCallback(async (expired: boolean, finalAnswers?: Answer[]) => {
    const answersToSubmit = finalAnswers ?? answers
    if (answersToSubmit.length === 0 && !expired) return

    setPhase('submitting')
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          token: sessionToken,
          answers: answersToSubmit,
          deviceFingerprint: fingerprint.current,
        }),
      })
      const data = await res.json() as { success: boolean; data?: SubmitResult; error?: string }
      if (data.success && data.data) {
        setResult(data.data)
        setPhase(data.data.passed ? 'result_pass' : 'result_fail')
      } else {
        setError(data.error ?? 'Submission failed')
        setPhase('error')
      }
    } catch {
      setError('Network error. Your answers may not have been saved.')
      setPhase('error')
    }
  }, [answers, sessionId, sessionToken])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const progress = currentQuestion
    ? Math.round(((currentQuestion.index) / currentQuestion.totalQuestions) * 100)
    : 0

  // ── Phases ────────────────────────────────────────────────────────────────

  if (phase === 'cooldown') {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link href={`/section/${slug}/learn`} className="text-sm text-teech-muted hover:text-teal transition-colors flex items-center gap-1">
          ← Back
        </Link>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full border-2 border-teal/20 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-8 h-8 text-teal/50" aria-label="Cooldown">
            <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
          </svg>
        </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Cooldown period</h1>
          <p className="text-teech-muted text-sm leading-relaxed max-w-xs mx-auto">
            You can retry this assessment in <span className="text-teal font-bold">{cooldownHours} hour{cooldownHours !== 1 ? 's' : ''}</span>.
            Use this time to review the content or practise.
          </p>
          <div className="flex flex-col gap-3 mt-8">
            <Link href={`/section/${slug}/practice`} className="btn-primary">
              Keep practising →
            </Link>
            <Link href={`/section/${slug}/learn`} className="btn-ghost">
              Review content
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'pre_check') {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link href={`/section/${slug}/practice`} className="text-sm text-teech-muted hover:text-teal transition-colors flex items-center gap-1">
          ← Practice mode
        </Link>

        <div>
          <span className="label block mb-1">Assessment</span>
          <h1 className="font-display text-2xl font-bold text-white">{sectionName}</h1>
        </div>

        {/* Rules */}
        <div className="bg-surface border border-teal/20 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-white text-sm">Before you begin</h2>
          {[
            `Answer ${10} questions — you need ${ASSESSMENT.PASS_THRESHOLD_PERCENT}% to pass`,
            `You have ${ASSESSMENT.SESSION_EXPIRY_MINUTES} minutes — the session expires automatically`,
            'Each question is served one at a time — you cannot go back',
            'Copy and paste is disabled during the assessment',
            'Your session is monitored for irregularities',
            `A ${ASSESSMENT.COOLDOWN_HOURS_AFTER_FAIL}-hour cooldown applies after a fail`,
          ].map((rule, i) => (
            <div key={i} className="flex gap-3 text-sm text-teech-muted">
              <span className="text-teal flex-shrink-0">·</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>

        <div className="bg-lime/8 border border-lime/20 rounded-xl p-4">
          <p className="text-xs text-lime font-semibold mb-1 flex items-center gap-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg> Verified credential</p>
          <p className="text-xs text-teech-muted">
            Passing generates a cryptographically-signed badge stored on our servers — a real, shareable credential.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <Button onClick={startSession} loading={loading} className="w-full" size="lg">
          Start assessment →
        </Button>
      </div>
    )
  }

  if (phase === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-2 border-teal border-t-transparent rounded-full animate-spin" />
        <p className="text-teech-muted text-sm">Scoring your assessment…</p>
      </div>
    )
  }

  if (phase === 'result_pass' && result) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="py-8">
          <div className="w-20 h-20 rounded-full border-2 border-lime/40 flex items-center justify-center mx-auto mb-4 animate-badge-pop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-lime" aria-label="Badge earned">
              <circle cx="12" cy="8" r="6" />
              <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">You passed!</h1>
          <p className="text-teech-muted text-sm mb-6">{sectionName}</p>

          <div className="bg-surface border border-teal/30 rounded-2xl p-6 max-w-xs mx-auto mb-6">
            <p className="font-display text-5xl font-black text-teal mb-1">
              {result.scorePercent.toFixed(0)}%
            </p>
            <p className="text-sm text-teech-muted">{result.correctCount} of {result.totalQuestions} correct</p>
          </div>

          {result.verificationUrl && (
            <div className="bg-lime/8 border border-lime/20 rounded-xl p-4 max-w-xs mx-auto mb-6">
              <p className="text-xs text-lime font-semibold mb-2 flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                Badge issued
              </p>
              <a
                href={result.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teech-muted hover:text-teal transition-colors break-all"
              >
                {result.verificationUrl}
              </a>
            </div>
          )}

          <Link href="/dashboard" className="btn-primary">
            Back to curriculum →
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'result_fail' && result) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="py-8">
          <div className="w-16 h-16 rounded-full border-2 border-teal/30 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-8 h-8 text-teal" aria-label="Keep going">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Not quite yet</h1>
          <p className="text-teech-muted text-sm mb-4">{sectionName}</p>

          <div className="bg-surface border border-teal/15 rounded-2xl p-5 max-w-xs mx-auto mb-6">
            <p className="font-display text-4xl font-black text-teal mb-1">{result.scorePercent.toFixed(0)}%</p>
            <p className="text-sm text-teech-muted">{result.correctCount} of {result.totalQuestions} correct</p>
            <p className="text-xs text-teech-muted mt-2">Need {ASSESSMENT.PASS_THRESHOLD_PERCENT}% to pass</p>
          </div>

          <p className="text-sm text-teech-muted max-w-xs mx-auto mb-6">{result.message}</p>

          <div className="space-y-3">
            <Link href={`/section/${slug}/practice`} className="btn-primary block">
              Practise more →
            </Link>
            <Link href={`/section/${slug}/learn`} className="btn-ghost block">
              Review the content
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 rounded-full border border-red-500/30 flex items-center justify-center mx-auto mb-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6 text-red-400" aria-label="Error">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
        <p className="text-red-400 text-sm">{error}</p>
        <Link href="/dashboard" className="btn-ghost inline-flex">Back to dashboard</Link>
      </div>
    )
  }

  // ── In progress ───────────────────────────────────────────────────────────

  if (!currentQuestion) return null

  const isLastQuestion = currentQuestion.index + 1 >= currentQuestion.totalQuestions
  const timerWarning = timeRemaining < 120

  return (
    <div className="space-y-5 no-select animate-fade-in">
      {/* Timer + progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-mono font-bold flex items-center gap-1.5 ${timerWarning ? 'text-red-400' : 'text-teech-muted'}`}>
            {''}{formatTime(timeRemaining)}
          </span>
          <span className="text-xs text-teech-muted">
            {currentQuestion.index + 1} / {currentQuestion.totalQuestions}
          </span>
        </div>
        <ProgressBar value={progress} colour={timerWarning ? 'red' : 'teal'} />
      </div>

      {/* Question */}
      <div className="bg-surface border border-teal/20 rounded-2xl p-5">
        <p className="text-white font-medium leading-relaxed">{currentQuestion.questionText}</p>
      </div>

      {/* Options */}
      {currentQuestion.options && (
        <div className="space-y-2">
          {currentQuestion.options.map(opt => {
            const isSelected = selectedKey === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedKey(opt.key)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                  isSelected
                    ? 'border-teal bg-teal/15 text-white'
                    : 'border-teal/15 text-white/65 hover:border-teal/35 bg-deep'
                }`}
              >
                <span className="font-bold mr-3 opacity-50">{opt.key.toUpperCase()}.</span>
                {opt.text}
              </button>
            )
          })}
        </div>
      )}

      <Button
        onClick={handleAnswerSubmit}
        disabled={!selectedKey}
        className="w-full"
        size="lg"
      >
        {isLastQuestion ? 'Submit assessment' : 'Next question →'}
      </Button>

      <p className="text-center text-xs text-teech-muted/50">
        Assessment in progress · Do not close this tab
      </p>
    </div>
  )
}
