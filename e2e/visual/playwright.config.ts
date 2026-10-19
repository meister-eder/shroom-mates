import { defineConfig, devices } from "@playwright/test";

/**
 * Screenshot-Vergleich (Regressionsschutz für Umbauten ohne Design-Änderung).
 * Startet Medusa-Mock, Website-Preview und Shop-Server selbst; vorher müssen
 * beide Apps gebaut sein (`scripts/verify.sh visual` erledigt das).
 * Baseline: `scripts/verify.sh baseline` (liegt lokal, nicht im Repo).
 *
 * Die Server-Befehle stehen in VISUAL_SERVERS (unten), damit ein Umbau der
 * App-Struktur nur diese Stelle und routes.ts ändern muss.
 */
const MOCK_PORT = 9010;

const VISUAL_SERVERS = [
	{
		command: `PORT=${MOCK_PORT} node ../mock/mock-medusa.mjs`,
		port: MOCK_PORT,
	},
	{
		command: "cd ../../apps/website && bun run astro preview --port 4400",
		port: 4400,
	},
	{
		command:
			"cd ../../apps/storefront && HOST=127.0.0.1 PORT=8000 node dist/server/entry.mjs",
		port: 8000,
	},
];

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
	webServer: VISUAL_SERVERS.map((s) => ({
		...s,
		reuseExistingServer: false,
		timeout: 60_000,
		env: { PUBLIC_MEDUSA_BACKEND_URL: `http://localhost:${MOCK_PORT}` },
	})),
});
