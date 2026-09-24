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
          DEFAULT: 'var(--color-brand)',
          light: 'var(--color-brand-light)',
          dark: 'var(--color-brand-dark)',
        },
        gold: {
          DEFAULT: 'var(--color-brand)',
          light: 'var(--color-brand-light)',
          dark: 'var(--color-brand-dark)',
          hover: 'var(--color-brand-light)',
        },
        surface: {
          bg: 'var(--color-surface-bg)',
          card: 'var(--color-surface-card)',
          border: 'var(--color-surface-border)',
          hover: 'var(--color-surface-hover)',
        },
        dark: {
          bg: 'var(--color-dark-bg)',
          surface: 'var(--color-dark-surface)',
          card: 'var(--color-dark-card)',
          muted: 'var(--color-dark-muted)',
          border: 'var(--color-dark-border)',
        },
        status: {
          live: '#DC2626',     // Red for live matches
          upcoming: '#0284C7', // Blue for upcoming
          completed: '#059669',// Green for completed
          warning: '#D97706',  // Amber for warnings
        }
      },
      fontFamily: {
        sans: ['Satoshi', 'Roboto', 'system-ui', 'sans-serif'],
        heading: ['Satoshi', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
