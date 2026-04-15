/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Strict mode for better development experience and catching issues early
  reactStrictMode: true,

  // Security headers â applied to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // XSS protection
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy â don't leak URLs
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy â restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(), payment=(self)',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://avatars.githubusercontent.com",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          // HSTS â force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },

  // Image optimisation â allow Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Disable x-powered-by header (don't advertise Next.js version)
  poweredByHeader: false,

  // Experimental features
  experimental: {
    // Server actions
    serverActions: {
      allowedOrigins: ['teech.au', 'www.teech.au', 'localhost:3000'],
    },
  },
}

module.exports = nextConfig
