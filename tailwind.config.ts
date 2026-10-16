import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          base: "#070B14",
          panel: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          borderHover: "#475569",
        },
        electric: {
          cyan: "#06B6D4",
          cyanHover: "#22D3EE",
        },
        signal: {
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#F43F5E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "var(--font-bangla)", "Hind Siliguri", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "var(--font-bangla)", "Hind Siliguri", "monospace"],
        bangla: ["var(--font-bangla)", "Hind Siliguri", "Noto Sans Bengali", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
