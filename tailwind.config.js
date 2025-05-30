// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // optional — if you still use /pages:
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* ——— Brand colours ——— */
      colors: {
        "walty-cream":   "#F7F3EC",
        "walty-teal":    "#005B55",
        "walty-orange":  "#C64A19",
        "walty-brown":   "#3E2C20",
        "walty-navy":    "#003A47",
        "walty-mustard": "#D9A520",
      },

      /* ——— Fonts (match CSS vars set by next/font) ——— */
      fontFamily: {
        // generic
        sans:    ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        display: ["var(--font-domine)", "Domine", "serif"],
        serif:   ["var(--font-recoleta)", "ui-serif", "serif"],

        // handy shortcuts — use `font-recoleta` or `font-domine` directly
        domine:   ["var(--font-domine)"],
        recoleta: ["var(--font-recoleta)"],
      },

      /* ——— Custom motion for the Popover ——— */
      keyframes: {
        pop: {
          "0%":   { opacity: "0", transform: "translate(-50%, -4px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
      },
      animation: {
        pop: "pop .15s ease-out forwards",
      },

      /* ——— Extras ——— */
      boxShadow: {
        card: "0 4px 10px -2px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};