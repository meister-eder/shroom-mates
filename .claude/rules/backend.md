---
paths:
  - "backend/**"
---

# Backend (Medusa 2)

- Medusa-Pakete sind exakt gepinnt (`2.13.1`); nur gemeinsam und bewusst anheben.
- Eigene Erweiterungen: Module in `src/modules/`, Routen in `src/api/{store,admin}/`, Events in `src/subscribers/`, Workflow-Hooks in `src/workflows/hooks/`. Vor Änderungen die jeweilige `README.md` dort und die Medusa-2-Doku beachten (keine Medusa-1-Muster).
- SumUp läuft über das npm-Paket `medusa-payment-sumup`, nicht über `.yalc/` (veraltete Kopie). Optionen inkl. `redirectUrlAllowedHosts` in `medusa-config.ts`.
- Lockfiles: CI nutzt `npm ci` (`package-lock.json`). `bun install` im Backend würfelt `bun.lock` großflächig um; bei Versionswechseln nur die betroffenen Zeilen anpassen und mit `bun install --frozen-lockfile` prüfen.
- Tests: `npm run test:unit`, `npm run test:integration:http` (braucht Postgres aus `docker-compose.dev.yml`).
