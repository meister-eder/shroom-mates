---
paths:
  - "apps/web/**"
  - "e2e/**"
---

# Web-App (Shop)

- Astro SSR mit React-Inseln. Medusa-Zugriffe nur über `src/lib/sdk.ts` und die Funktionen in `src/lib/data/`; Client-Zustand (Warenkorb) über nanostores in `src/lib/stores/`.
- Formulare mit react-hook-form + zod.
- Checkout/Zahlung (`src/lib/checkout/`, `src/modules/checkout/`): SumUp-Session nutzt nur `session.data.id`; `data.redirect_url` ist `<origin>/<countryCode>/checkout/complete` und muss im Backend erlaubt sein. Zahlungslogik nicht für Design-Änderungen anfassen.
- Der Warenkorb heißt im UI „Pilzkorb“.
- Nach Änderungen am Checkout die Playwright-Tests in `e2e/` laufen lassen (`bun run test:checkout`).
