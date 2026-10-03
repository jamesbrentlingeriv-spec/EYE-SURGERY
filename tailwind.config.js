/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ophthalmic: {
          dark: '#060a12',
          panel: '#0d1522',
          card: '#131e30',
          border: '#1e2e48',
          cyan: '#00d2ff',
          laserRed: '#ff2a55',
          amber: '#f59e0b',
          emerald: '#10b981',
          irisBlue: '#1d4ed8',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
