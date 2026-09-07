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
          DEFAULT: '#FDE047', // Vivid Gold (Yellow 300)
          light: '#FEF08A',
          dark: '#EAB308',
        },
        gold: {
          DEFAULT: '#FDE047',
          light: '#FEF08A',
          dark: '#EAB308',
          hover: '#FEF08A',
        },
        surface: {
          bg: '#0D0E11',     // Deep black background
          card: '#16181D',   // Dark card background
          border: '#2E323D', // Dark border
          hover: '#242730',  // Dark hover
        },
        dark: {
          bg: '#FFFFFF',       // Pure white for headings & primary text
          surface: '#F1F5F9',  // Off-white / light slate for subheadings & nav links
          card: '#F8FAFC',     // Bright light text
          muted: '#CBD5E1',    // Slate 300 for crisp muted text
          border: '#2E323D',   // Dark border
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
