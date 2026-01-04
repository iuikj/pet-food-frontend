/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#A3D9A5", // Soft sage green
        secondary: "#FFE898", // Warm yellow
        "accent-blue": "#B2EBF2", // Soft blue
        "background-light": "#FAFAF9", // Warm off-white
        "background-dark": "#1C1C1E", // Soft dark gray
        "surface-light": "#FFFFFF",
        "surface-dark": "#2C2C2E",
        "text-main-light": "#2D3748",
        "text-main-dark": "#F7FAFC",
        "text-muted-light": "#718096",
        "text-muted-dark": "#A0AEC0",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
