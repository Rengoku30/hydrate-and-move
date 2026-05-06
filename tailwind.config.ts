import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}', './index.html'],
  theme: {
    extend: {
      colors: {
        // New palette (requested)
        // Background: #F8F9F4, Cards: #FFFFFF, Primary: #2A9D8F, Secondary: #E9C46A, Text: #264653
        wine: '#2A9D8F', // primary accent (hydration)
        sand: '#E9C46A', // secondary accent (movement)
        walnut: '#264653', // text
        cream: '#F8F9F4', // soft background base
        bronze: '#264653', // headings/borders (kept aligned with text)
        sky: '#F8F9F4', // app canvas background (body)
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(38, 70, 83, 0.12)',
        ring: '0 0 0 4px rgba(42, 157, 143, 0.22)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
