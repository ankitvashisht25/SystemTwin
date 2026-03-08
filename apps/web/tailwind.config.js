/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0a0e17',
          800: '#0f1520',
          700: '#151d2e',
          600: '#1c2640',
        },
        accent: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          pink: '#ec4899',
        },
        status: {
          healthy: '#10b981',
          degraded: '#f59e0b',
          failed: '#ef4444',
        },
        border: {
          DEFAULT: '#1e293b',
          light: '#334155',
        },
      },
    },
  },
  plugins: [],
};
