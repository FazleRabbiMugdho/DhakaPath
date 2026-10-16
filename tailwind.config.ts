import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DhakaPath light world: white surfaces, green brand (Pathao-style grammar).
        brand: {
          DEFAULT: "#1BA94B",
          dark: "#15863B",
          deep: "#0B3321",
          soft: "#E3F4E9",
          mint: "#F1FAF4",
          canvas: "#F6FBF4",
        },
        line: "#DCEDE2",
        ink: {
          DEFAULT: "#0E2A1A",
          soft: "#4C6356",
          faint: "#8AA294",
        },
        warn: { DEFAULT: "#B45309", bg: "#FEF3C7", line: "#FCD34D" },
        danger: { DEFAULT: "#DC2626", bg: "#FEF2F2", line: "#FCA5A5" },
        info: { DEFAULT: "#2563EB", bg: "#EFF6FF", line: "#BFDBFE" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "var(--font-bangla)", "Hind Siliguri", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "var(--font-bangla)", "Hind Siliguri", "monospace"],
        bangla: ["var(--font-bangla)", "Hind Siliguri", "Noto Sans Bengali", "sans-serif"],
      },
      boxShadow: {
        card: "0 24px 60px -44px rgba(16,42,26,0.5)",
        lift: "0 18px 40px -20px rgba(27,169,75,0.5)",
        cta: "0 14px 32px -12px rgba(27,169,75,0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
