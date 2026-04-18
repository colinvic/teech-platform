// @ts-nocheck
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/card'

interface PracticeQuestion {
  id: string
  questionText: string
  options: Array<{ key: string; text: string }>
  correctAnswer: string
  explanation: string
  difficulty: number
}

interface PracticePageProps {
params: { slug: string }
}

// Client-side practice mode Ã¢ÂÂ questions fetched from public practice bank
// Practice is unscored, unlimited, and shows explanations immediately
export default function PracticePage({ params }: PracticePageProps) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [loading, setLoading] = useState(true)

     useEffect(() => {
       setSlug(params.slug)
       fetchPracticeQuestions(params.slug)
     }, [params])

  const fetchPracticeQuestions = useCallback(async (sectionSlug: string) => {
    try {
      const res = await fetch(`/api/practice/questions?slug=${sectionSlug}`)
      const data = await res.json() as { success: boolean; data?: { questions: PracticeQuestion[]; sectionName: string } }
      if (data.success && data.data) {
        setQuestions(data.data.questions)
        setSectionName(data.data.sectionName)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSelect(key: string) {
    if (revealed) return
    setSelectedKey(key)
  }

  function handleReveal() {
    if (!selectedKey) return
    setRevealed(true)
    const question = questions[currentIndex]
    if (question && selectedKey === question.correctAnswer) {
      setCorrectCount(c => c + 1)
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setSessionComplete(true)
      return
    }
    setCurrentIndex(i => i + 1)
    setSelectedKey(null)
    setRevealed(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (sessionComplete || questions.length === 0) {
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
    const readyForAssessment = score >= 60

    return (
      <div className="space-y-6 animate-fade-in">
        <Link href={`/section/${slug}/learn`} className="text-sm text-teech-muted hover:text-teal transition-colors flex items-center gap-1">
          Ã¢ÂÂ Back
        </Link>

        <div className="text-center py-8">
          <div className="text-6xl mb-4">{readyForAssessment ? 'ready' : 'keep-going'}</div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            {readyForAssessment ? 'Looking good!' : 'Keep practising'}
          </h1>
          <p className="text-teech-muted mb-6">
            You got {correctCount} of {questions.length} correct ({score}%)
          </p>
          <ProgressBar value={score} colour={readyForAssessment ? 'lime' : 'teal'} className="mb-6 max-w-xs mx-auto" />

          {readyForAssessment ? (
            <div className="space-y-3">
              <Link href={`/section/${slug}/assess`} className="btn-primary block text-center">
                Take the assessment Ã¢ÂÂ
              </Link>
              <button
                onClick={() => {
                  setCurrentIndex(0)
                  setSelectedKey(null)
                  setRevealed(false)
                  setCorrectCount(0)
                  setSessionComplete(false)
                }}
                className="text-sm text-teech-muted hover:text-teal transition-colors"
              >
                Practise again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setCurrentIndex(0)
                  setSelectedKey(null)
                  setRevealed(false)
                  setCorrectCount(0)
                  setSessionComplete(false)
                }}
                className="btn-primary"
              >
                Try again
              </button>
              <Link href={`/section/${slug}/learn`} className="block text-sm text-teech-muted hover:text-teal transition-colors">
                Review the content first
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  if (!question) return null

  const progressPct = Math.round((currentIndex / questions.length) * 100)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <Link href={`/section/${slug}/learn`} className="text-sm text-teech-muted hover:text-teal transition-colors flex items-center gap-1 mb-3">
          Ã¢ÂÂ {sectionName}
        </Link>
        <div className="flex items-center justify-between mb-1">
          <span className="label">Practice</span>
          <span className="text-xs text-teech-muted">{currentIndex + 1} / {questions.length}</span>
        </div>
        <ProgressBar value={progressPct} colour="teal" />
      </div>

      {/* Question */}
      <div className="bg-surface border border-teal/15 rounded-2xl p-5">
        <p className="text-white font-medium leading-relaxed mb-5">{question.questionText}</p>

        <div className="space-y-2">
          {question.options.map(opt => {
            const isSelected = selectedKey === opt.key
            const isCorrect = opt.key === question.correctAnswer
            const showResult = revealed

            let className = 'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 '

            if (!revealed) {
              className += isSelected
                ? 'border-teal bg-teal/15 text-white'
                : 'border-teal/15 text-white/65 hover:border-teal/40 hover:text-white bg-deep'
            } else {
              if (isCorrect) className += 'border-lime bg-lime/15 text-lime'
              else if (isSelected && !isCorrect) className += 'border-red-500/50 bg-red-500/10 text-red-400'
              else className += 'border-teal/10 text-teech-muted bg-deep'
            }

            return (
              <button
                key={opt.key}
                className={className}
                onClick={() => handleSelect(opt.key)}
                disabled={revealed}
              >
                <span className="font-bold mr-3 opacity-60">{opt.key.toUpperCase()}.</span>
                {opt.text}
                {showResult && isCorrect && <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' className='w-4 h-4 ml-2 inline flex-shrink-0' aria-label='Correct'><polyline points='20 6 9 17 4 12'/></svg>}
                {showResult && isSelected && !isCorrect && <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' className='w-4 h-4 ml-2 inline flex-shrink-0' aria-label='Incorrect'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Explanation Ã¢ÂÂ shown after reveal */}
      {revealed && (
        <div className="bg-raised border border-teal/20 rounded-xl p-4 animate-slide-up">
          <p className="text-xs font-semibold text-teal uppercase tracking-wide mb-2">Explanation</p>
          <p className="text-sm text-white/65 leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {!revealed ? (
          <Button
            onClick={handleReveal}
            disabled={!selectedKey}
            className="w-full"
            size="lg"
          >
            Check answer
          </Button>
        ) : (
          <Button onClick={handleNext} className="w-full" size="lg">
            {currentIndex + 1 >= questions.length ? 'See results' : 'Next question Ã¢ÂÂ'}
          </Button>
        )}
      </div>

      {/* Score tracker */}
      <p className="text-center text-xs text-teech-muted/70">
        {correctCount} correct so far ÃÂ· Practice mode Ã¢ÂÂ no limit, no time pressure
      </p>
    </div>
  )
}
