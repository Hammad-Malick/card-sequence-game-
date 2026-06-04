/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        board: {
          green: '#1a472a',
          'green-light': '#2d6a4f',
          'green-dark': '#0f2d1a',
          border: '#2d5a3d',
        },
        chip: {
          blue: '#3B82F6',
          green: '#22C55E',
          red: '#EF4444',
        },
        card: {
          bg: '#1e293b',
          border: '#334155',
          hover: '#2d3f55',
        },
      },
      animation: {
        'chip-place': 'chipPlace 0.3s ease-out',
        'chip-remove': 'chipRemove 0.2s ease-in',
        'card-flip': 'cardFlip 0.4s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        chipPlace: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '80%': { transform: 'scale(1.2) rotate(5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        chipRemove: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      fontFamily: {
        game: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
