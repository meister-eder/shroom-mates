import { defineConfig, devices } from "@playwright/test";

/**
 * Shroom-Mates E2E Test Suite
 *
 * Prerequisites (all must be running):
 *   1. docker compose -f docker-compose.dev.yml up -d  (postgres + redis)
 *   2. cd backend && bun run dev                          (Medusa on :9000)
 *   3. cd apps/storefront && bun run dev                  (Storefront on :8000)
 *
 * The database must be seeded with sample data.
 * These tests use NO mocks — they test against the real running application.
 */

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // e-commerce tests are order-sensitive (cart state)
  workers: 1, // Single worker to avoid cart conflicts
  retries: 1,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: "http://localhost:8000",
    locale: "de-DE",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Web server config — uncomment to auto-start dev servers
  // webServer: [
  //   {
  //     command: "cd ../backend && bun run dev",
  //     port: 9000,
  //     reuseExistingServer: true,
  //     timeout: 30_000,
  //   },
  //   {
  //     command: "cd ../apps/storefront && bun run dev",
  //     port: 8000,
  //     reuseExistingServer: true,
  //     timeout: 30_000,
  //   },
  // ],
});
