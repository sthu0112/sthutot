/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: "#f0fdfa", 100: "#ccfbf1", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 900: "#134e4a" },
        medical: { bg: "#fcfcfd", card: "#ffffff", border: "#e2e8f0", muted: "#64748b", ink: "#0f172a" }
      },
      fontFamily: { sans: ["Inter","system-ui","sans-serif"] },
      borderRadius: { '2xl': '16px', '3xl': '24px' },
      boxShadow: { 'soft': '0 4px 24px rgba(15,23,42,0.06)', 'card': '0 8px 32px rgba(15,23,42,0.08)' }
    },
  },
  plugins: [],
}
