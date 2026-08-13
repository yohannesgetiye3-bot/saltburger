/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        salt: {
          DEFAULT: '#00A651',
          50: '#E8F8EF',
          100: '#C5EDD6',
          200: '#8FDCAF',
          300: '#5AC78B',
          400: '#2DB56C',
          500: '#00A651',
          600: '#009047',
          700: '#00733A',
          800: '#005C2E',
          900: '#004523',
        },
        charcoal: {
          DEFAULT: '#141414',
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#C8C8C8',
          300: '#9B9B9B',
          400: '#6B6B6B',
          500: '#4A4A4A',
          600: '#333333',
          700: '#242424',
          800: '#1A1A1A',
          900: '#141414',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px -2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        pop: '0 8px 30px -6px rgba(0,166,81,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pop-in': 'popIn 0.2s ease-out',
        shimmer: 'shimmer 1.4s infinite linear',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        popIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
    },
  },
  plugins: [],
};
