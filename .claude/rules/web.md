---
paths:
  - "apps/web/**"
  - "e2e/**"
---

# Web-App (Shop)

- Astro SSR mit React-Inseln. Medusa-Zugriffe nur über `src/lib/sdk.ts` und die Funktionen in `src/lib/data/`; Client-Zustand (Warenkorb) über nanostores in `src/lib/stores/`.
- Keine Länderpräfixe in URLs: Shop unter `/shop/…`, Rechtstexte im Wurzelpfad; die eine Region löst `getRegion()` auf (`DEFAULT_REGION` oder erste Region, 1 h Cache). Alte `/de/…`-URLs leitet die Middleware per 301 um.
- Formulare mit react-hook-form + zod.
- Checkout/Zahlung (`src/lib/checkout/`, `src/modules/checkout/`): SumUp-Session nutzt nur `session.data.id`; `data.redirect_url` ist `<origin>/shop/checkout/complete` (die alte Adresse `/de/checkout/complete` leitet per 301 weiter, Query bleibt) und muss im Backend erlaubt sein. Zahlungslogik nicht für Design-Änderungen anfassen.
- Der Warenkorb heißt im UI „Pilzkorb“.
- Nach Änderungen am Checkout die Playwright-Tests in `e2e/` laufen lassen (`bun run test:checkout`).
