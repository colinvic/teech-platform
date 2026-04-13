import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider'

export const metadata: Metadata = {
  title: {
    default: 'teech.au — Australian Learning Platform',
    template: '%s | teech.au',
  },
  description:
    "Australia's mobile-first, ACARA-aligned learning platform. Pass curriculum sections, earn verified badges, and connect with expert tutors — anywhere in Australia.",
  keywords: ['Australian curriculum', 'ACARA', 'online learning', 'tutoring', 'student badges', 'mobile learning'],
  authors: [{ name: 'teech.au', url: 'https://teech.au' }],
  creator: 'Flecco Group Pty Ltd',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://teech.au'),
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://teech.au',
    siteName: 'teech.au',
    title: 'teech.au — Australian Learning Platform',
    description: 'Pass ACARA curriculum sections. Earn verified badges. Connect with expert tutors.',
    images: [{ url: '/logo-dark.svg', width: 520, height: 120, alt: 'teech.au' }],
  },
  icons: {
    icon:        [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple:       [{ url: '/icon.svg',    sizes: '180x180'       }],
    shortcut:    [{ url: '/favicon.svg'                         }],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#090E1A',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body className="min-h-screen bg-deep text-white antialiased font-sans">
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  )
}
