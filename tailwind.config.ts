import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "oklch(0.975 0.004 145)",
        pino: "oklch(0.255 0.055 155)",
        hoja: "oklch(0.47 0.12 153)",
        dorado: "oklch(0.91 0.19 112)",
        terracota: "oklch(0.61 0.19 32)",
      },
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "sans-serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
