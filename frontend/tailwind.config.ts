import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens — flip via CSS variables when .dark is on
        // <html>, so every existing bg-paper/text-ink/etc automatically
        // respects the toggle with zero per-component changes.
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        stone: "rgb(var(--color-stone) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        // Token names kept as "lake"/"clay" from the original palette to
        // avoid a risky rename across ~25 files — the VALUES now map to
        // the real brand: lake = the logo's gold (primary accent), clay =
        // a muted bronze derived from it (secondary accent).
        lake: {
          DEFAULT: "rgb(var(--color-lake) / <alpha-value>)",
          light: "rgb(var(--color-lake-light) / <alpha-value>)",
          dark: "rgb(var(--color-lake-dark) / <alpha-value>)",
        },
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        // Fixed (never themed) — for sections deliberately always-dark
        // regardless of light/dark mode: the hero, footer, admin nav,
        // lightbox backdrop. "night" is the exact logo teal-black; "cream" is
        // the light neutral used for content that must stay legible on
        // "night".
        night: "#0A1417",
        cream: "#F6F4EE",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-plex)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "6px",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
