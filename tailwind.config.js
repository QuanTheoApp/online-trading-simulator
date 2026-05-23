/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#060910',
          900: '#0b1120',
          800: '#131b2e',
          700: '#1a2540',
          600: '#1e2d4a',
          500: '#2a3a5c',
        },
        brand: {
          DEFAULT: '#f0b429',
          light: '#f7c948',
          dark: '#cb8e17',
        },
        profit: {
          DEFAULT: '#10b981',
          light: '#34d399',
        },
        loss: {
          DEFAULT: '#ef4444',
          light: '#f87171',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
