import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D0D',
        surface: '#131313',
        'surface-elevated': '#1C1C1C',
        border: '#262626',
        brand: {
          red: '#E92034',
          orange: '#FF871F',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(233,32,52,0.12) 0%, rgba(255,135,31,0.12) 100%)',
        'radial-glow': 'radial-gradient(600px circle at var(--x,50%) var(--y,0%), rgba(233,32,52,0.14), transparent 60%)',
      },
      boxShadow: {
        glow: '0 0 80px -20px rgba(233,32,52,0.35)',
        'glow-orange': '0 0 80px -20px rgba(255,135,31,0.35)',
      },
      height: {
        18: '4.5rem',
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
