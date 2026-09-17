import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#319085",
          dark: "#21665c",
          light: "#e3f3f1",
        },
      },
    },
  },
  plugins: [],
};

export default config;
