import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '375px',  // Extra small devices (iPhone SE, small phones)
      },
    },
  },
  plugins: [],
};

export default config;
