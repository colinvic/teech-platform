/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    missingSuspenseWithCSRBailout: false,
    serverActions: {
      allowedOrigins: ['teech.au', 'www.teech.au', 'localhost:3000'],
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=(self)' },
          { key: 'Content-Security-Policy', value: ["default-src 'self'","script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com","style-src 'self' 'unsafe-inline' https://fonts.googleapis.com","font-src 'self' https://fonts.gstatic.com","img-src 'self' data: https://avatars.githubusercontent.com","connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.stripe.com","frame-src https://js.stripe.com https://hooks.stripe.com","object-src 'none'","base-uri 'self'"].join('; ') },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', port: '', pathname: '/storage/v1/object/public/**' }],
  },
  poweredByHeader: false,
}
module.exports = nextConfig
