import { defineConfig, devices } from "@playwright/test";
import { mockWebServers } from "../servers";

/**
 * Screenshot-Vergleich (Regressionsschutz für Umbauten ohne Design-Änderung).
 * Startet Medusa-Mock und den Web-Server selbst; vorher muss
 * die App gebaut sein (`scripts/verify.sh visual` erledigt das).
 * Baseline: `scripts/verify.sh baseline` (liegt lokal, nicht im Repo).
 *
 * Die Server-Befehle stehen in ../servers.ts, damit ein Umbau der
 * App-Struktur nur diese Stelle und routes.ts ändern muss.
 */
export default defineConfig({
  testDir: ".",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  outputDir: "../test-results/visual",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.004,
      threshold: 0.2,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    locale: "de-DE",
    reducedMotion: "reduce",
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: mockWebServers,
});
