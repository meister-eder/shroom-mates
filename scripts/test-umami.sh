#!/usr/bin/env bash
# Umami-Tracker-Test: baut die Web-App mit einer Dummy-Website-ID nach
# apps/web/dist-umami (das normale dist bleibt unberührt) und führt
# e2e/smoke/umami.spec.ts dagegen aus. dist-umami wird danach gelöscht, damit
# Lint und `astro check` es nicht sehen.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PUBLIC_MEDUSA_BACKEND_URL="${PUBLIC_MEDUSA_BACKEND_URL:-http://localhost:9010}"
export PUBLIC_UMAMI_WEBSITE_ID="00000000-0000-0000-0000-000000000000"
export ASTRO_TELEMETRY_DISABLED=1
trap 'rm -rf "$ROOT/apps/web/dist-umami"' EXIT
(cd "$ROOT/apps/web" && node scripts/copy-cms.mjs && npx astro build --outDir dist-umami)
cd "$ROOT/e2e"
WEB_DIST=dist-umami npx playwright test -c smoke/playwright.config.ts umami.spec.ts
