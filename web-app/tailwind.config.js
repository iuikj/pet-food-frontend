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
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'medium': '0 10px 30px -5px rgba(0, 0, 0, 0.12)',
        'large': '0 20px 50px -10px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(163, 217, 165, 0.4)',
        'glow-lg': '0 0 30px rgba(163, 217, 165, 0.5)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
