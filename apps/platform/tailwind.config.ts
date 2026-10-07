import type { Config } from 'tailwindcss';

const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: withVar('bg'),
        surface: withVar('surface'),
        muted: withVar('muted'),
        border: withVar('border'),
        fg: withVar('fg'),
        'fg-muted': withVar('fg-muted'),
        brand: {
          DEFAULT: withVar('brand'),
          fg: withVar('brand-fg'),
          soft: withVar('brand-soft'),
        },
        success: withVar('success'),
        warning: withVar('warning'),
        danger: withVar('danger'),
        info: withVar('info'),
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '0.875rem' },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.06)',
        pop: '0 10px 30px -10px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
