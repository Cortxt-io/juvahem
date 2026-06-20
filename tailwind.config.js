/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte}'],
  // Preflight OFF on purpose: juvahem ships a complete, finely-tuned base + scoped
  // styles, and relies on default list/heading rendering. The border-style compat
  // for shadcn's `border` utilities is added in app.css instead.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        border: 'var(--line)',
        input: 'var(--line)',
        ring: 'var(--accent)',
        background: 'var(--bg)',
        foreground: 'var(--ink)',
        primary: { DEFAULT: 'var(--accent)', foreground: '#ffffff' },
        secondary: { DEFAULT: 'var(--accent-soft)', foreground: 'var(--accent-dark)' },
        muted: { DEFAULT: 'var(--surface-2)', foreground: 'var(--muted)' },
        accent: { DEFAULT: 'var(--accent-soft)', foreground: 'var(--accent-dark)' },
        card: { DEFAULT: 'var(--card)', foreground: 'var(--ink)' },
        'accent-dark': 'var(--accent-dark)',
        gold: 'var(--gold)',
        'gold-dark': 'var(--gold-dark)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ["'Inter'", 'system-ui', '-apple-system', 'sans-serif'],
        display: ["'Familjen Grotesk'", 'system-ui', 'sans-serif'],
        mono: ["'Space Mono'", 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
