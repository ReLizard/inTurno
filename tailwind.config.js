/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1e2229',
          darker: '#14171c',
          card: '#272c36',
          yellow: '#facc15',
          gold: '#eab308',
          green: '#22c55e',
          neon: '#4ade80',
          pastel: '#eef7f2',
          pastelBorder: '#d5e9dc'
        }
      }
    },
  },
  plugins: [],
}
