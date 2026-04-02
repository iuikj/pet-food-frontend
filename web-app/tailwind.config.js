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
        // --- 项目自定义颜色 ---
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
        // --- shadcn/ui CSS 变量颜色 ---
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        "sh-primary": { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        "sh-secondary": { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        sans: ["'Geist Variable'", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'xl': '1.5rem',
        '2xl': '2rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(163, 217, 165, 0.4)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.7' },
          '50%': { transform: 'translateY(-20px) scale(1.05)', opacity: '1' },
        },
        'dot-blink': {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
        'paw-step': {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-15deg)' },
          '50%': { opacity: '1', transform: 'scale(0deg)' },
          '100%': { opacity: '0', transform: 'scale(0.5) rotate(15deg)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'dot-blink': 'dot-blink 1.4s ease-in-out infinite',
        'paw-step': 'paw-step 2s ease-in-out infinite',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
