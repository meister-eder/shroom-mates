/**
 * Gemeinsamer Server-Aufbau für die Mock-Läufe (visual, smoke): Medusa-Mock,
 * Website-Preview und Shop-Server. Beide Apps müssen vorher gebaut sein
 * (`scripts/verify.sh` erledigt das). Bei einem Umbau der App-Struktur nur
 * diese Stelle (und visual/routes.ts) anpassen.
 */
export const MOCK_PORT = 9010;

export const MOCK_SERVERS = [
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

export const mockWebServers = MOCK_SERVERS.map((s) => ({
  ...s,
  reuseExistingServer: false,
  timeout: 60_000,
  env: { PUBLIC_MEDUSA_BACKEND_URL: `http://localhost:${MOCK_PORT}` },
}));
