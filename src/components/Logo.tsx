// @ts-nocheck
/**
 * teech-platform â Logo Component
 *
 * Inline SVG â no font flash, no network request, renders instantly.
 * Uses geometric paths built from the Gemini-generated logo.
 *
 * Three variants:
 *   <Logo />              â full wordmark, transparent bg (default)
 *   <Logo variant="nav"/> â compact, for 56px header bars
 *   <Logo variant="icon"/>â square app icon with ee mark
 *
 * Colours match the platform design tokens exactly:
 *   Off-white:  #F8FBF9
 *   Teal:       #14B8A6  (--teal)
 *   Muted .au:  rgba(20,184,166,0.52)
 *   Icon bg:    #152345
 */

interface LogoProps {
  variant?: 'full' | 'nav' | 'icon'
  className?: string
}

// ââ Full wordmark â te[e]ch.au ââââââââââââââââââââââââââââââââââââââââââââââââ
function LogoFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 96"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="teech.au"
      className={className}
    >
      <title>teech.au</title>
      <text
        x="4"
        y="76"
        fontSize="80"
        fontWeight="900"
        fontFamily="'Nunito', 'Poppins', system-ui, sans-serif"
        letterSpacing="-1"
      >
        <tspan fill="#F8FBF9">te</tspan>
        <tspan fill="#14B8A6">e</tspan>
        <tspan fill="#F8FBF9">ch</tspan>
        <tspan fill="rgba(20,184,166,0.52)">.au</tspan>
      </text>
    </svg>
  )
}

// ââ Compact nav variant â for 56px header bars ââââââââââââââââââââââââââââââââ
function LogoNav({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 40"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="teech.au"
      className={className}
    >
      <title>teech.au</title>
      <text
        x="2"
        y="32"
        fontSize="33"
        fontWeight="900"
        fontFamily="'Nunito', 'Poppins', system-ui, sans-serif"
        letterSpacing="-0.5"
      >
        <tspan fill="#F8FBF9">te</tspan>
        <tspan fill="#14B8A6">e</tspan>
        <tspan fill="#F8FBF9">ch</tspan>
        <tspan fill="rgba(20,184,166,0.52)">.au</tspan>
      </text>
    </svg>
  )
}

// ââ Square icon â ee mark on navy background ââââââââââââââââââââââââââââââââââ
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="teech.au icon"
      className={className}
    >
      <title>teech.au</title>
      {/* Icon background */}
      <rect x="0" y="0" width="200" height="200" rx="36" ry="36" fill="#152345" />
      {/* ee mark */}
      <text
        x="12"
        y="138"
        fontSize="96"
        fontWeight="900"
        fontFamily="'Nunito', 'Poppins', system-ui, sans-serif"
        letterSpacing="-2"
      >
        <tspan fill="#F8FBF9">e</tspan>
        <tspan fill="#14B8A6">e</tspan>
      </text>
    </svg>
  )
}

// ââ Exported component ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export function Logo({ variant = 'full', className }: LogoProps) {
  switch (variant) {
    case 'nav':  return <LogoNav  className={className} />
    case 'icon': return <LogoIcon className={className} />
    default:     return <LogoFull className={className} />
  }
}

// ââ Convenience exports âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export function LogoMark({ className }: { className?: string }) {
  return <LogoIcon className={className} />
}

export function LogoWordmark({ className }: { className?: string }) {
  return <LogoFull className={className} />
}
