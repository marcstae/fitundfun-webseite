import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F2F5F9",
          100: "#DCE5F0",
          400: "#3A5BF0",
          500: "#3A5BF0",
          600: "#2A4BD0",
          700: "#1C3854",
          800: "#122741",
          900: "#0A1728",
          950: "#0E1C30",
        },
        accent: {
          DEFAULT: "#3A5BF0",
          light: "#5C77FF",
        },
        ink: "#0E1C30",
        muted: "#6B7686",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        display: ["var(--font-archivo-black)", "var(--font-archivo)", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease forwards",
        "fade-in": "fade-in 0.4s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
