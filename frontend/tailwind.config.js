/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B4332',
          dark: '#081C15',
          light: '#2D6A4F',
        },
        pista: {
          DEFAULT: '#85A98F',
          light: '#D8E2DC',
        },
        sage: {
          pale: '#EBF3EA',
          border: '#D1DFD4',
          muted: '#4A6B56',
        },
        canvas: {
          bg: '#F8FAF8',
          card: '#FFFFFF',
          darkText: '#0D2818',
        },
        status: {
          good: '#2D6A4F',
          moderate: '#B45309',
          poor: '#C2410C',
          severe: '#7F1D1D',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
