/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0F2A4A", 2: "#17365C", soft: "#EEF2F7" },
        gold: { DEFAULT: "#B08D57", dark: "#8C6D31", light: "#D9C29A" },
        ink: "#1F2937",
        muted: "#5B6778",
        hair: "#E3E7ED",
        teal: { DEFAULT: "#2F6B5E" },
        slatex: "#3E5C7E",
      },
      fontFamily: {
        serif: ["Cambria", "Georgia", "serif"],
        sans: ["Calibri", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
