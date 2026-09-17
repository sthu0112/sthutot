/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: "#f0fdfa", 100: "#ccfbf1", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 900: "#134e4a" },
        medical: { bg: "#fcfcfd", card: "#ffffff", border: "#e2e8f0", muted: "#64748b", ink: "#0f172a" },
        // Seed design tokens
        forest: { DEFAULT: "#1c3a13", depths: "#1c3a13" },
        lime: { DEFAULT: "#d3fa99", pulse: "#d3fa99" },
        sage: "#757c5d",
        olive: "#9f995b",
        euca: "#698e79",
        snow: "#fcfcf7",
        stone: "#eeeee9",
        frosted: "#c4c7c4",
        ash: "#b3b3b3",
        pewter: "#666666",
        ink: "#000000",
      },
      fontFamily: { sans: ["Inter","Be Vietnam Pro","system-ui","sans-serif"], display: ["Inter","Be Vietnam Pro","system-ui","sans-serif"], serif: ["Playfair Display","Be Vietnam Pro","serif"], mono: ["JetBrains Mono","IBM Plex Mono","monospace"] },
      borderRadius: { '2xl': '16px', '3xl': '24px', pill: '1000px' },
      boxShadow: { 'soft': '0 4px 24px rgba(15,23,42,0.06)', 'card': '0 8px 32px rgba(15,23,42,0.08)' }
    },
  },
  plugins: [],
}
