'use client'

/**
 * teech-platform — Accessibility Provider
 *
 * Provides a platform-wide bold/large-text toggle.
 * Activated by the spectacles button (bottom-left, all screens).
 *
 * When active:
 * - Body gets class 'teech-bold-mode'
 * - All text weights jump to font-semibold minimum
 * - Font sizes increase by one step
 * - Letter spacing opens slightly for readability
 * - Line height increases
 * - Border contrast increases
 *
 * State persists to localStorage under 'teech-bold-mode'.
 * Preference is read on mount (SSR-safe: defaults off, then hydrates).
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface AccessibilityContextValue {
  boldMode: boolean
  toggleBoldMode: () => void
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  boldMode: false,
  toggleBoldMode: () => {},
})

export function useAccessibility() {
  return useContext(AccessibilityContext)
}

const STORAGE_KEY = 'teech-bold-mode'
const BODY_CLASS  = 'teech-bold-mode'

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [boldMode, setBoldMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Hydrate from localStorage on mount only (SSR-safe)
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') {
        setBoldMode(true)
        document.body.classList.add(BODY_CLASS)
      }
    } catch {
      // localStorage unavailable — proceed with default
    }
  }, [])

  const toggleBoldMode = useCallback(() => {
    setBoldMode(prev => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      if (next) {
        document.body.classList.add(BODY_CLASS)
      } else {
        document.body.classList.remove(BODY_CLASS)
      }
      return next
    })
  }, [])

  // Suppress hydration mismatch by not rendering toggle until mounted
  if (!mounted) {
    return (
      <AccessibilityContext.Provider value={{ boldMode: false, toggleBoldMode }}>
        {children}
      </AccessibilityContext.Provider>
    )
  }

  return (
    <AccessibilityContext.Provider value={{ boldMode, toggleBoldMode }}>
      {children}
    </AccessibilityContext.Provider>
  )
}
