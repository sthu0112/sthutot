/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: "#f0fdfa", 100: "#ccfbf1", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 900: "#134e4a" },
        medical: { bg: "#f8fafc", card: "#ffffff", border: "#e2e8f0", muted: "#64748b" }
      },
      fontFamily: { sans: ["Inter","system-ui","sans-serif"] }
    },
  },
  plugins: [],
}
