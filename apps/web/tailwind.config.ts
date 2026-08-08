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
        // Light-first base — the institutional site's default surface.
        bg: '#FFFFFF',
        surface: '#FAFAFA',
        'surface-alt': '#F3F3F3',
        border: '#E5E5E5',
        ink: '#0D0D0D',
        'ink-soft': '#1C1C1C',
        brand: {
          red: '#E92034',
          orange: '#FF871F',
        },
        // Deliberate dark accent — footer, one contrast section, product
        // mockups (the legal SaaS dashboard). Never the site's default.
        dark: {
          bg: '#0D0D0D',
          surface: '#1C1C1C',
          border: '#262626',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #E92034 0%, #FF871F 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(233,32,52,0.08) 0%, rgba(255,135,31,0.08) 100%)',
      },
      boxShadow: {
        glow: '0 0 80px -20px rgba(233,32,52,0.25)',
      },
      height: {
        18: '4.5rem',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {},
    },
  },
  plugins: [],
} satisfies Config;
