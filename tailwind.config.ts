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
        bg0: '#050505',
        bg1: '#0f0f0f',
        card: 'rgba(20, 20, 20, 0.6)',
        cardBorder: 'rgba(255, 255, 255, 0.1)',
        text0: '#ffffff',
        text1: '#e5e5e5',
        text2: '#a0a0a0',
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
