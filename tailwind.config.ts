import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1a1714",
          soft: "#3a342e",
        },
        sand: {
          50: "#faf8f5",
          100: "#f3efe8",
          200: "#e7ded2",
          300: "#d6c8b6",
        },
        gold: {
          DEFAULT: "#a9874e",
          dark: "#8a6d3a",
          light: "#c4a572",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        luxe: "0 20px 60px -20px rgba(26, 23, 20, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
