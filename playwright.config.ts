import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    geolocation: { latitude: -2.171, longitude: -79.902 },
    permissions: ["geolocation"],
  },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
})
