/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFBF7',
          100: '#FAF4EB',
          200: '#F3ECE0',
          300: '#E5DCCE',
        },
        maroon: {
          50: '#FDF2F4',
          100: '#F9DEE3',
          200: '#F2B9C4',
          500: '#9E2A40',
          600: '#882236',
          700: '#741A2B',
          800: '#5F1422',
          900: '#460C18',
        },
        ink: '#2B161B',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        brand: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
