import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Void colors (dark backgrounds)
        void: {
          400: "#6b7280",
          500: "#4b5563",
          600: "#374151",
          700: "#1f2937",
          800: "#111827",
          900: "#0a0a0f",
          950: "#050507",
        },
        // Rune colors (accents)
        rune: {
          neon: "#8b5cf6",
          glow: "#a78bfa",
          toxic: "#22c55e",
        },
        // Legacy eldritch colors for compatibility
        eldritch: {
          void: "#0a0a0f",
          dark: "#12121a",
          purple: "#8b5cf6",
          glow: "#a78bfa",
          blood: "#dc2626",
          bone: "#f5f5f4",
        },
      },
      animation: {
        "fog-flow": "fogFlow 60s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "void-breathe": "voidBreathe 8s ease-in-out infinite",
        "rune-glow": "runeGlow 2s ease-in-out infinite",
      },
      keyframes: {
        fogFlow: {
          "0%": { transform: "translate(0, 0)" },
          "100%": { transform: "translate(-50%, -50%)" },
        },
        voidBreathe: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        runeGlow: {
          "0%, 100%": { opacity: "0.5", filter: "blur(0px)" },
          "50%": { opacity: "1", filter: "blur(2px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
