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
        sans:    ["var(--font-ambit)", "AmbitRegular", "ui-sans-serif", "system-ui"],
        display: ["var(--font-recoleta)", "serif"],
        serif:   ["var(--font-recoleta)", "ui-serif", "serif"],

        // handy shortcut
        recoleta: ["var(--font-recoleta)"],
        ambit:    ["var(--font-ambit)"],
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

      fontSize: {
        'display-h1': ["3rem", { lineHeight: "1.1", fontWeight: "600", fontFamily: "var(--font-recoleta)" }],
        'display-h2': ["2rem", { lineHeight: "1.1", fontWeight: "600", fontFamily: "var(--font-recoleta)" }],
        'sub-head'  : ["1.5rem", { lineHeight: "1.1", fontWeight: "500", fontFamily: "var(--font-recoleta)" }],
        body       : ["1.125rem", { lineHeight: "1.5", fontWeight: "400", fontFamily: "var(--font-ambit)" }],
        'cta-sm'   : ["0.875rem", { lineHeight: "1.4", fontWeight: "600", fontFamily: "var(--font-ambit)" }],
      },

      /* ——— Extras ——— */
      boxShadow: {
        card: "0 4px 10px -2px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};