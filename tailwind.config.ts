import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Dark mode colors (primary)
        bg0: '#050505',
        bg1: '#0f0f0f',
        // Card colors - use CSS variables that switch based on theme
        card: 'var(--card-bg)',
        cardBorder: 'var(--card-border)',
        // Text colors - use CSS variables that switch based on theme
        text0: 'var(--text-0)',
        text1: 'var(--text-1)',
        text2: 'var(--text-2)',
        // Light mode colors
        'light-bg0': 'var(--bg-light-0)',
        'light-bg1': 'var(--bg-light-1)',
        'light-bg2': 'var(--bg-light-2)',
        'light-card': 'var(--card-light)',
        'light-card-border': 'var(--card-border-light)',
        'light-text0': 'var(--text-light-0)',
        'light-text1': 'var(--text-light-1)',
        'light-text2': 'var(--text-light-2)',
        'light-text3': 'var(--text-light-3)',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 4px 12px rgba(0, 0, 0, 0.06)',
        'glowSm': '0 0 20px rgba(255, 255, 255, 0.03)',
        'glowMd': '0 0 40px rgba(255, 255, 255, 0.05)',
      },
      borderRadius: {
        '20': '20px',
        '24': '24px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
