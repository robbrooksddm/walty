// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // ⬇️ tell Tailwind what "serif" means in YOUR project
        serif: ['var(--font-recoleta)', 'ui-serif', 'serif'],
        // (Optional) drop in a shortcut so you can write `font-recoleta`
        recoleta: ['var(--font-recoleta)'],
      },
    },
  },
  plugins: [],
};