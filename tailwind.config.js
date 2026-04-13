/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        deep:    '#090E1A',
        surface: '#111827',
        raised:  '#1A2640',
        teal: {
          DEFAULT: '#14B8A6',
          light:   '#2DD4BF',
          pale:    '#CCFBF1',
        },
        lime: {
          DEFAULT: '#A3E635',
          light:   '#BEF264',
        },
        amber: {
          DEFAULT: '#FBBF24',
          light:   '#FCD34D',
        },
        teech: {
          bg:      '#090E1A',
          surface: '#111827',
          border:  'rgba(20,184,166,0.18)',
          text:    '#F0F9FF',
          muted:   '#64748B',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
        'badge-pop':    'badgePop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
        'spark-pulse':  'sparkPulse 2s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        slideUp:   { '0%': { opacity:'0', transform:'translateY(12px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        badgePop:  { '0%': { transform:'scale(0)' }, '60%': { transform:'scale(1.15)' }, '100%': { transform:'scale(1)' } },
        sparkPulse:{ '0%,100%': { opacity:'1' }, '50%': { opacity:'0.5' } },
        shimmer:   { '0%': { backgroundPosition:'200% 0' }, '100%': { backgroundPosition:'-200% 0' } },
      },
    },
  },
  plugins: [],
}
