import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        // Serif carries body prose — this is a reading-first product.
        serif: ['"Source Serif 4 Variable"', 'Georgia', 'serif'],
        // Sans is for headings, labels, and chrome only.
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Warm neutral scale. Warm greys read editorial; cool slate reads "dashboard".
        paper: '#faf9f7',
        surface: '#ffffff',
        // Contrast on paper (#faf9f7): 16.4 / 12.5 / 6.7 / 4.9 — every step clears
        // WCAG AA for normal text, since even `faint` carries real content
        // (labels, milestone counts, figure captions).
        ink: {
          DEFAULT: '#1c1b19',
          body: '#33302b',
          muted: '#5c5852',
          faint: '#726d64',
        },
        rule: {
          DEFAULT: '#e4e0d9',
          strong: '#cec9bf',
        },
        // Exactly one accent. It means: active, your progress, a link.
        accent: {
          DEFAULT: '#a8422a',
          hover: '#8f3722',
          soft: '#f4e9e4',
        },
      },
      fontSize: {
        // Prose is set larger than UI text on purpose.
        prose: ['1.1875rem', { lineHeight: '1.7' }],
        'prose-sm': ['1.0625rem', { lineHeight: '1.65' }],
      },
      maxWidth: {
        // ~68 characters at the prose size — the comfortable reading measure.
        measure: '34rem',
        reading: '43rem',
      },
      letterSpacing: {
        label: '0.08em',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
