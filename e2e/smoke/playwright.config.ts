import { defineConfig, devices } from "@playwright/test";
import { mockWebServers } from "../servers";

/**
 * Smoke-Test Pilzkorb gegen den Medusa-Mock (`scripts/verify.sh smoke`).
 * Server-Aufbau geteilt mit dem Screenshot-Vergleich (../servers.ts).
 */
export default defineConfig({
  testDir: ".",
  outputDir: "../test-results/smoke",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    locale: "de-DE",
    reducedMotion: "reduce",
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 800 },
  },
  webServer: mockWebServers,
});
