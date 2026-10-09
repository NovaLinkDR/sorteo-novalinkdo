import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        surface: "#121214",
        surface2: "#1A1A1D",
        line: "#27272A",
        "line-soft": "#1F1F23",
        accent: "#22C55E",
        "accent-bright": "#4ADE80",
        "accent-dim": "#15803D",
        mute: "#A1A1AA",
        faint: "#71717A",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,197,94,0.35), 0 0 24px -6px rgba(34,197,94,0.45)",
        "glow-soft": "0 0 40px -12px rgba(34,197,94,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
