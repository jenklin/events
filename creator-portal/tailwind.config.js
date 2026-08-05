/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter has no CJK glyphs — Korean (Seoul) and Traditional Chinese
        // (Taipei) guests need explicit fallbacks or WebViews pick low-quality
        // or wrong-variant system fonts. Per-glyph fallback keeps Latin in Inter.
        sans: [
          'var(--font-inter)', 'Inter',
          '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"',
          '"PingFang TC"', '"Noto Sans TC"', '"Microsoft JhengHei"',
          'sans-serif',
        ],
        serif: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        // cloudpeers brand palette (Brand Guidelines v4) — mirrors cloudpeers.com
        paradigm: {
          'deep-black': '#050505',
          dark: '#0a0a0c',
          panel: '#151518',
          // Brand-color slots overridable per event via CSS vars (white-label
          // branding from the events template engine); defaults = cloudpeers.
          purple: 'var(--brand-primary, #8b5cf6)',
          'purple-light': 'var(--brand-primary-light, #a78bfa)',
          accent: '#3b82f6',
          'accent-light': '#60a5fa',
          teal: 'var(--brand-secondary, #14b8a6)',
          'teal-light': 'var(--brand-secondary-light, #5eead4)',
          coral: '#e85d75',
          'coral-light': '#f08da0',
          olive: '#6b7556',
          gold: '#c4a962',
          cream: '#f5f2ed',
          text: '#e2e8f0',
          muted: '#94a3b8',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
