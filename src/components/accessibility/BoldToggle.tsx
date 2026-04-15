// @ts-nocheck
'use client'

/**
 * teech-platform â Bold Mode Toggle Button
 *
 * Fixed position, bottom-left of every authenticated screen.
 * Positioned above the bottom navigation bar on mobile.
 *
 * Positioning:
 *   bottom-[72px] places it 72px from the bottom â clear of the
 *   ~52px bottom nav (py-2 + icon + label + pb-safe).
 *   On screens without a bottom nav (auth, admin) it still sits
 *   neatly in the bottom-left corner without obstruction.
 *
 * Uses the spectacles SVG icon â no emojis.
 *
 * Visual states:
 *   Off â subtle, low-contrast, does not distract from content
 *   On  â teal fill, clearly active, readable at a glance
 *
 * Fully keyboard accessible:
 *   - Focusable with Tab
 *   - aria-pressed reflects current state
 *   - aria-label describes both states clearly
 *   - Enter / Space toggle
 */

import { useAccessibility } from './AccessibilityProvider'
import { IconSpectacles } from '@/components/icons'

export function BoldToggle() {
  const { boldMode, toggleBoldMode } = useAccessibility()

  return (
    <button
      onClick={toggleBoldMode}
      aria-label={
        boldMode
          ? 'Bold text mode is on â click to turn off'
          : 'Turn on bold text mode for easier reading'
      }
      aria-pressed={boldMode}
      title={
        boldMode
          ? 'Bold text mode: on'
          : 'Bold text mode: off â click to enable larger, bolder text'
      }
      className={[
        // Positioned above the bottom nav bar
        'fixed bottom-[72px] left-4 z-50',
        // Size and shape
        'w-11 h-11 rounded-full',
        // Layout
        'flex items-center justify-center',
        // Smooth transitions
        'transition-all duration-200',
        // Border always present for visibility
        'border',
        // State-dependent appearance
        boldMode
          ? 'bg-teal border-teal text-deep shadow-lg shadow-teal/25 scale-105'
          : 'bg-surface/90 border-teal/20 text-teech-muted backdrop-blur-sm hover:border-teal/50 hover:text-white hover:scale-105',
        // Focus ring â clear visual indicator for keyboard users
        'focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-deep focus-visible:outline-none',
      ].join(' ')}
    >
      <IconSpectacles
        className="w-5 h-5"
        aria-hidden={false}
        title={boldMode ? 'Bold mode active' : 'Bold mode inactive'}
      />
    </button>
  )
}
