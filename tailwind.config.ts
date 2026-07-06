import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F6EFDD",
        pino: "#123B29",
        hoja: "#4C7028",
        dorado: "#E5A11C",
        terracota: "#CE5228",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-hanken)", "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
