/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Token warna yang berubah mengikuti tema terang/gelap
        app: v("app"),
        card: v("card"),
        subtle: v("subtle"),
        line: v("line"),
        fg: v("fg"),
        muted: v("muted"),
        heading: v("heading"),
        brand: { DEFAULT: v("brand"), 2: v("brand-2") },
        accent: { DEFAULT: v("accent"), soft: v("accent-soft"), tint: v("accent-tint") },
        // Warna tetap
        gold: { DEFAULT: "#B08D57", dark: "#8C6D31", light: "#D9C29A" },
        teal: { DEFAULT: "#2F8A74" },
        slatex: "#4B76A8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px -6px rgb(15 23 42 / 0.08)",
      },
    },
  },
  plugins: [],
};
