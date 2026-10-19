# Shroom Mates

Website und Onlineshop für Speisepilze, Growkits und Tinkturen (shroom-mates.de). Inhalte und UI-Texte auf Deutsch.

## Aufbau

Monorepo mit Bun-Workspaces und Turbo (`apps/*`, `packages/*`):

- `apps/website`: Astro 6, statisch gebaut. Inhalte als Content Collections in `src/content/` (Schema in `src/content.config.ts`), gepflegt über Sveltia CMS (`public/admin/`, wird vor dev/build von `scripts/copy-cms.mjs` kopiert).
- `apps/web`: Astro 6 SSR (`@astrojs/node`), React-Inseln, plain CSS, nanostores. Spricht mit Medusa über `@medusajs/js-sdk` (`src/lib/sdk.ts`). Routen unter `src/pages/[countryCode]/`.
- `packages/ui`: geteilte Tokens (`tokens.css`), Styles und Astro-Komponenten (Header, Footer, WaveDivider …) für beide Apps.
- `backend`: Medusa 2 mit Zahlungsplugin `medusa-payment-sumup`, eigenen Modulen (`resend`, `withdrawal`) und Subscribern. **Kein** Workspace: eigene Abhängigkeiten, CI nutzt `npm ci` mit `package-lock.json`.
- `e2e`: Playwright-Tests für den Shop.

Lokales Setup (Postgres, Redis, SumUp-Sandbox) bei Bedarf in `docs/LOCAL_DEVELOPMENT.md` nachlesen, Deployment in `DEPLOYMENT.md`.

## Befehle

```bash
bun install                                         # Workspaces
bun run --filter @shroom-mates/website lint         # Biome (nur Website)
bun run --filter @shroom-mates/website build        # astro check + build
bun run --filter @shroom-mates/web build
cd backend && npm ci && npx medusa build            # Backend
cd backend && npm run test:unit                     # bzw. test:integration:http
cd e2e && bun run test                              # Playwright
```

Für Shop-UI ohne Backend: Dev-Server `medusa-mock` und `web-dev` aus `.claude/launch.json` (Mock: `e2e/mock/mock-medusa.mjs`).

Prüfen mit einem Befehl (knappe PASS/FAIL-Ausgabe, volle Logs in `.verify-logs/`):

```bash
scripts/verify.sh            # lint + build aller Workspaces
scripts/verify.sh visual     # + Screenshot-Vergleich gegen lokale Baseline (e2e/visual)
scripts/verify.sh backend    # Medusa-Unit-Tests
scripts/verify.sh all
```

Baseline (`scripts/verify.sh baseline`) nur auf einem bewusst abgenommenen Stand neu erzeugen.

## Autonome Plan-Läufe

Pläne mit Checkboxen liegen in `docs/plans/`. Abarbeiten mit dem Skill `run-plan` (ein Orchestrator, nacheinander je ein `plan-worker`-Subagent auf Sonnet). Der Plan ist der Zustand; nichts davon im Gespräch duplizieren.

## Compact instructions

Bei Kompaktierung behalten: aktueller Plan-Pfad und Task-ID, offene Fehler (nur FAIL-Zeilen), Entscheidungen, die noch nicht im Plan-Log stehen. Verwerfen: Worker-Berichte erledigter Tasks, Build-/Test-Ausgaben, gelesene Dateiinhalte.

## Konventionen

- Commits im Stil `feat(scope): …` / `fix(scope): …` (Scopes z.B. `shop`, `ui`, `footer`, `design`, `website`).
- TypeScript, keine `.js` in `src/scripts/`; Client-Skripte modul-gekapselt, keine `window.*`-Globals, Scroll-Handler über `requestAnimationFrame`.
- Barrierefreiheit (WCAG 2.2 AA) und wenig JavaScript sind Pflicht, nicht optional.
- Website ist mit Tabs formatiert (Biome); vor dem Abschluss `lint` laufen lassen.
- Lockfiles nicht pauschal neu erzeugen (siehe `.claude/rules/backend.md`).
- Das Repo ist **öffentlich**: keine Secrets, Server-IPs, Datenbank-IDs oder lokalen Pfade committen; Server-Adressen kommen aus GitHub Secrets (`DEPLOY_HOST`) bzw. `DOMAIN`. Der Pre-Commit-Hook in `.githooks/` prüft das (einmalig pro Klon: `git config core.hooksPath .githooks`). `--no-verify` nur bei nachgewiesenem Fehlalarm.

## Design

@DESIGN.md
