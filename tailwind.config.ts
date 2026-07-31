import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F1",
        paper: "#FFFFFF",
        ink: "#2C2C2B",
        muted: "#7D7A75",
        line: "#E6E2DA",
        sage: {
          DEFAULT: "#55624F",
          soft: "#EEF1EC",
        },
        gold: "#B08D57",
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        ticker: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        drip: {
          "0%": { top: "-100%" },
          "60%, 100%": { top: "100%" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        cdPop: {
          "0%": { transform: "translateY(6px)", opacity: "0.4" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        ticker: "ticker 28s linear infinite",
        marquee: "marquee 46s linear infinite",
        drip: "drip 2s ease-in-out infinite",
        breathe: "breathe 3.2s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
        cdPop: "cdPop 0.45s ease",
      },
    },
  },
  plugins: [],
}

export default config
