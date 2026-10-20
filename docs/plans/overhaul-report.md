# Overhaul-Bericht

Stand: 2026-10-20, Branch `overhaul`. Plan: `docs/plans/overhaul.md`.

## Prüfung

- Clean install (`rm -rf node_modules apps/*/node_modules && bun install --frozen-lockfile`): 1010 Pakete, Lockfile unverändert, `git status` sauber.
- `scripts/verify.sh all`: lint, build, smoke, visual, backend jeweils PASS.

## Was sich je Phase geändert hat

- P1 Quick wins: html-Schriftgröße 106,25 %, tote Meta-Tags/Schemas/Komponenten/Bilder entfernt, 404-Rewrite mit echtem 404-Status und deutschem Text.
- P2 Tooling: Biome im Root, `astro check`, CI lintet/baut alle Workspaces, Backend-Unit-Tests in CI, Guard-Logik extrahiert (8 Unit-Tests).
- P3 Eine Quelle für Inhalte: Versandfakten in `@shroom-mates/ui/shop-facts`; Growkit-, Guide- und Über-uns-Inhalte als Frontmatter statt geparstem Markdown; Growkit-Zeile aus Produkt-Metadata.
- P4 Shop-SEO: Product/Breadcrumb/ItemList-JSON-LD, Cache-Control, 5-Minuten-Produktcache, SSR-sitemap.xml und robots.txt, `noindex` für Widerrufsseite.
- P5 Front-end-Diät: native View Transitions, Sticky-Header, schlanker Store-API-Client (SDK nicht mehr im Browser-Bundle), Vanilla-Komponenten (CartButton, Toast, QuickAdd), Drawer als natives `<dialog>`, Tailwind entfernt (reines CSS mit Mini-Preflight), Tokens bereinigt, gemeinsamer `.btn--outline`.
- P6 Datenschutz-Guard: Playwright-Prüfung über 18 Routen plus Karten-Klick, keine Verstöße (bleibt bannerfrei).
- P7 Eine App, eine Domain: `apps/web` (Website prerendert + Shop SSR unter `/shop/`), eine Region, Legacy-301 für `/de/…` und `shop.`-Host, ein Layout/Header/404, Caddy-Setup, zusammengeführte Datenschutzerklärung, selbst gehostetes cookieloses Umami mit Shop-Events, Live-Vorschau im CMS mit echtem Seitendesign.

## Messwerte (gzip, geladene JS/CSS-Dateien je Seitentyp, gebauter Server gegen Mock)

Vorher (Review): Website ca. 17 KB JS, Shop ca. 90 KB JS, Shop-CSS 16 KB.

| Seitentyp | JS | CSS |
|---|---|---|
| Startseite | 20,9 KB | 15,5 KB |
| Growkits | 12,4 KB | 15,8 KB |
| Katalog (/shop/) | 13,1 KB | 14,6 KB |
| Produkt | 76,2 KB | 13,9 KB |
| Pilzkorb | 74,6 KB | 13,9 KB |
| Kasse | 105,5 KB | 13,9 KB |

Katalog sinkt von ca. 90 auf 13 KB JS (kein React mehr); Produkt/Pilzkorb ca. 75 KB, Kasse 105 KB (React, CheckoutPage, SumUp-Anbindung). Die Startseite enthält jetzt zusätzlich Tracker und Warenkorb-Button (+4 KB gegenüber der alten Website). Die Werte sind eine Messung im Mock, ohne externe Skripte (SumUp-Widget, Umami-Tracker vom eigenen Host sind nicht eingerechnet, falls nicht geladen).

## Abweichungen und blockierte Tasks

- P5.6 BLOCKED (Branch `failed/P5.6`, 4c7fa5c): Scroll-Snap-Karussell funktioniert, aber der mobile Screenshot `shop-produkt-growkit` weicht von der Baseline ab (altes React-Galerie-Bild lud nach fullPage-Resize den 1049w-Kandidaten, das neue behält korrekt 524w). Re-Baseline war nicht erlaubt. Entscheidung für Menschen: ok, dann cherry-pick und diesen einen Key neu baselinen; der Branch setzt `loading=eager` für alle Galeriebilder.
- P5.8b: No-op (Scope war bereits semantisches CSS).
- P5.10: Schrittkarten bewusst nicht vereinheitlicht (nicht identisch, Designentscheidung nötig).
- P7.4: `shop-404` (Desktop/Mobil) neu baselined (jetzt Website-404 plus Pilzkorb).
- Caddyfiles: in P7.7 mit `caddy validate` geprüft, echter Test erst auf Staging.

## Manuelle Follow-ups (aus dem Plan-Log)

- P1.1: px font sizes in components (--body-size: 17px, shop.css, growkits.astro, CartPage) don't scale with browser font setting; separate task.
- P1.3: stale comment 'SvgHeading reads SVGs from ./public' in apps/storefront/Dockerfile (~l.45); COPY public stays needed.
- P2.1: 107 Biome warnings remain (non-null assertions, any, !important) — possible cleanup task. Never put comments in biome.json (breaks excludes silently).
- P2.2: deploy-server.yml installs backend deps with bun install instead of npm ci (out of scope, review).
- P3.1: packages/ui/src/legal/agb.md must be updated by hand when shipping prices change. 'Lieferung nur innerhalb Deutschlands' in OrderSummary.tsx/CartPage.tsx still hardcoded.
- P3.5: enter metadata erste_ernte + temperatur for live growkit products in Medusa Admin (line hidden until then). Seed: austernseitlinge-growkit got White-Pearl values (no Rosenseitling seed product).
- P4.1: storefront site falls back to localhost:4321 unless PUBLIC_SITE_URL is set (only docker-compose.test.yml sets it) — canonical/JSON-LD URLs; P7.3 hardcodes site, check afterwards.
- P5.1: view-transition fade now 0.3s for both apps (website had 0.6s). Unused cleanup return in hamburger.ts setupHamburgerMenu.
- P5.2: scroll-padding-top 5rem (85px) < mobile header height (~103px): anchor sections' top padding slightly under the header (headings visible). Header line-heights set to whole px (.ticker 21/17px, .header-info 21px). Unused --spacing-navbar* in theme.css (goes with P5.8d).
- P5.3: browser store-api client untested against the real backend with publishable key (x-publishable-api-key) and credentials: include — test a full checkout on staging. Client JS after P5.3: React 58.3 KB, CheckoutPage 35.0 KB, total ≈111.7 KB gzip.
- P5.5: drawer screenshots old vs new in session scratchpad (p55/); mobile filled-state drawer not compared, check by eye on staging. Drawer thumbnails now load on open (data-src).
- P5.6: decide on branch failed/P5.6 (4c7fa5c): scroll-snap carousel works; only [mobile] shop-produkt-growkit differs (old React gallery loaded 1049w candidate after fullPage resize; new one keeps correct 524w). If OK: cherry-pick + rebaseline that one key. Note: it sets loading=eager on all gallery images.
- P5.7: three mascot-eyes implementations remain (MatesLogo.astro, React MatesEyes.tsx for cart/checkout/order pages, vanilla lib/mates-eyes.ts for drawer/toast using /mascot.webp) — unify as separate task.
- P5.8c: billing-address h3 has no bottom margin (Tailwind mb-4 never applied before either) — design check.
- P5.8d: storefront global.css re-imports tokens.css after base.css (keeps --gutter 32px on mobile as baseline expects) — design decision. CSS 17.5 KB → 15.0 KB gzip.
- P5.9 (design, DESIGN.md Rückweg): hex values without exact token left in code: #b9bbe6, #ff7a45, #bfc1ea, #fff0eb, #c0392b, #b0aca5, #555, #2f2c57, #000, #fff8d6, #ffe66d, #ffc9a8, #15132b, #ebc477c5, #fdfcea, #5c5a50; plus SVG presentation-attribute hex values.
- P5.10 (design): step cards comic-panel / step / how-card differ visibly (image height, borders, shadows, type) — unify only after a design decision.
- P7.1: compose service renamed storefront → web: next deploy leaves an orphan storefront container (docker compose up --remove-orphans); adjust branch protection if it checks old CI job/step names.
- P7.2: set SumUp redirect to https://shroom-mates.de/shop/checkout/complete in SumUp dashboard (if configured) and server backend .env (old /de/ path 301s). Not redirected: /de/<unknown>, other country prefixes.
- P7.3: website build.assets 'assets' + manualChunks not carried over (assets now under /_astro/) — Caddy immutable caching for /_astro/* covers it.
- P7.4: re-baselined shop-404-desktop/mobile (now the website 404 + Pilzkorb, checked vs web-404). Marketing pages have no region: adding to cart there only works with an existing cart (cart brings region).
- P7.5: Caddyfiles not validated locally (no caddy, Docker daemon off) — staging deploy is the first real check. Server .env (staging/prod): point SUMUP_REDIRECT_URL, STORE_CORS, AUTH_CORS, MEDUSA_BACKEND_URL to the main domain if set explicitly. Search Console: add new sitemap, keep shop. property during redirect period. X-Frame-Options now SAMEORIGIN (was DENY on website). deploy-server.yml: every deploy is a full deploy now.
- P7.6 (legal review): merged packages/ui/src/legal/datenschutz.md — all legal-open/legal-check marks, date, log retention, Web3Forms address; GitHub-Pages section kept (drop if site no longer on GH Pages); obsolete 'Online-Shop' pointer section dropped; check AGB/Widerruf URLs.
- P7.7: Umami first run — change default admin password, create website, set PUBLIC_UMAMI_WEBSITE_ID in .env (staging/prod), set up funnel (DEPLOYMENT.md). Legal review of new datenschutz.md sections (13/16/17, legal-open; retention open: Umami doesn't auto-delete). data-domains=shroom-mates.de → no tracking on test domain. purchase fires again on order-page reload. DATABASE_URL uses unencoded password (as Medusa). Staging compose has no Caddy/tracker.
- P7.8: try the CMS preview in /admin/ for each page type (Sveltia login; templates not yet tested in a real Sveltia run), incl. admin CSP frame-src for srcdoc iframe; Caddyfile change not validated with caddy. No preview yet for single collections mushrooms/growkits. Preview endpoint loads page CSS via loopback 127.0.0.1:$PORT.

---
