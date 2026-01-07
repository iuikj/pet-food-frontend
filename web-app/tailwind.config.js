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
        primary: "#A3D9A5", // Soft sage green as primary
        secondary: "#FFE898", // Warm yellow for accents
        "accent-blue": "#B2EBF2", // Soft blue for hydration/mix
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
      borderRadius: {
        DEFAULT: "1rem",
        'xl': '1.5rem',
        '2xl': '2rem',
        '3xl': '2rem', // kept for compatibility if needed, though user asked for 2xl as 2rem
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(163, 217, 165, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}
