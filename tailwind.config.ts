import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fdf9ee",
          100: "#f9f3e6",
          400: "#e0bf6a",
          500: "#d4af37",
          600: "#b8952c",
          700: "#8f7222",
        },
      },
    },
  },
  plugins: [],
};
export default config;
