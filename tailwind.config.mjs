/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#135bec',
        'background-dark': '#0a0a0a',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 2s ease-out forwards',
        'fade-in-delayed': 'fadeIn 2s ease-out 0.5s forwards',
        'fade-in-late': 'fadeIn 2s ease-out 1.2s forwards',
        'cursor-blink': 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};
