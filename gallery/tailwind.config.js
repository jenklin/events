/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        // Runtime-overridable brand tokens (an album theme can override these
        // via --brand-color / --brand-accent on :root). Defaults are cloudpeers.
        'brand-color': 'var(--brand-color)',
        'brand-accent': 'var(--brand-accent)',
        // cloudpeers brand palette (Brand Guidelines v4) — mirrors cloudpeers.com
        paradigm: {
          'deep-black': '#050505',
          dark: '#0a0a0c',
          panel: '#151518',
          purple: '#8b5cf6',
          'purple-light': '#a78bfa',
          accent: '#3b82f6',
          'accent-light': '#60a5fa',
          teal: '#14b8a6',
          'teal-light': '#5eead4',
          coral: '#e85d75',
          gold: '#c4a962',
          text: '#e2e8f0',
          muted: '#94a3b8',
        },
      },
    },
  },
  plugins: [],
}
