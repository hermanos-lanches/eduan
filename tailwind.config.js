/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          page: '#111111',
          card: '#1A1A1A',
          nav:  '#222222',
        },
        border: { DEFAULT: '#2A2A2A' },
        text:   { primary: '#E5E5E5', secondary: '#888888' },
        accent: '#D4572A',
        chart: {
          leads:       '#4A8FD4',
          conversions: '#3D7A6C',
          sonnet:      '#4A8FD4',
          haiku:       '#3D7A6C',
          opus:        '#C4A560',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
