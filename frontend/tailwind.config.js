/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d8eeff',
          200: '#b9e0ff',
          300: '#89ccfe',
          400: '#52affb',
          500: '#2b8ef6',
          600: '#146fe9',
          700: '#1058d4',
          800: '#1347ab',
          900: '#153e86',
        }
      }
    },
  },
  plugins: [],
}
