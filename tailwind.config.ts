import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#26292D", 2: "#32363B", fg: "#F5F2EA", mute: "#A9ADB1" },
        gold: {
          50: "#FDF8EA",
          100: "#FBF0D2",
          400: "#F6C24A",
          500: "#F2B01E",
          600: "#D99A10",
          700: "#8F6A12",
        },
        surface: "#F7F5F0",
        line: "#E3DFD6",
        muted: "#6C7074",
        brand: { yellow: "#F6BE28", green: "#66A04A", red: "#D84A38", blue: "#1A7AB8" },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
