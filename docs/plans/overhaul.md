# Overhaul plan: one fast, accessible, SEO-first site

Source: architecture review of 2026-10-19. Executed autonomously by the
`run-plan` orchestrator (`.claude/skills/run-plan/SKILL.md`) with
`plan-worker` subagents (Sonnet), one task at a time, on branch `overhaul`
(worktree `.claude/worktrees/overhaul`). Lands on `shop` at the end (P8).

Stack stays: Astro, Medusa 2, SumUp, self-hosted Docker/Caddy. No migration away
from any of it.

## Status protocol

- `- [ ]` open · `- [x]` done (short commit SHA appended) · `- [!]` blocked (reason in Log)
- A task may start only when every ID in its `deps` is `[x]`. If a dep is `[!]`, mark the task `[!] dep`.
- Only the orchestrator edits checkboxes and the Log. Workers never edit this file.
- Failed work is parked on branch `failed/<ID>` (never `git stash`: the stash is shared with other worktrees).

## Global rules for every task (workers read this section + their own task only)

1. Read `CLAUDE.md`, `DESIGN.md` (rules part) and the `.claude/rules/*.md` matching the files you touch. They win over this plan if they conflict, except where a task explicitly says to change one of them.
2. Stay inside the task's scope. Do not refactor neighbouring code, rename things, or "improve" unrelated files. Note anything else you find under "Follow-ups" in your report.
3. UI copy stays German. Code comments: match the file you are in.
4. No visual changes unless the task says so. Tasks tagged `verify: visual` must pass `scripts/verify.sh visual` (screenshot diff against the baseline taken before P1). Never run `scripts/verify.sh baseline` unless the task explicitly allows re-baselining.
5. Payment logic (`apps/storefront/src/lib/checkout/`, `initPaymentSession`/`placeOrder` in the cart store, SumUp widget, backend payment hooks) keeps its behaviour. Only tasks that say so may touch it, and only as described.
6. No new dependencies unless the task names them. Never regenerate lockfiles wholesale (see `.claude/rules/backend.md`); `bun install` after editing a `package.json` is fine.
7. Public repo: no secrets, server IPs, local absolute paths. The pre-commit hook checks this; never use `--no-verify`.
8. Verify with `scripts/verify.sh <mode>` (it prints PASS/FAIL plus only the relevant error lines; full logs in `.verify-logs/`). Do not paste whole logs into your report.
9. Commit once at the end with the task's commit message (+ the `Co-Authored-By` trailer from the commit conventions). Stage explicit paths, never `git add -A` blindly; check `git status` first.
10. Report to the orchestrator in at most 10 lines: `DONE <sha>` or `BLOCKED <reason>`, verify result, follow-ups / manual steps for the humans.

## Manual follow-ups (collected by the orchestrator for the humans)

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

---

## P0 Safety net (done during setup)

- [x] **P0.1** Screenshot harness `e2e/visual/` + `scripts/verify.sh` + Medusa mock in `e2e/mock/`; baseline of 18 pages × desktop/mobile taken on the unchanged code.

## P1 Quick wins

- [x] **P1.1 Respect the user's font size** · deps: — · verify: visual · 4d81baa
  `packages/ui/src/base.css` sets `html { font-size: 17px }`. Change to `106.25%` (identical at the 16px browser default, scales with user settings). Grep both apps for other `html`/`:root` absolute font sizes and fix the same way.
  Commit: `fix(ui): root font size relative to user setting`

- [x] **P1.2 Clean up website SEO meta and JSON-LD** · deps: — · verify: quick · ab82bed
  In `apps/website`:
  - `layouts/Layout.astro`: remove `meta keywords`, the two self-referencing `hreflang` links, the `geo.*`/`ICBM` meta and the `geo` block with TODO coordinates, and the whole `hasOfferCatalog` (offers without prices are invalid). Keep LocalBusiness core: `@id`, name, legalName, image, description, address, url, email, sameAs, founder, areaServed. Remove `priceRange: "$$"`. Fix `og:image:width/height`: compute from the actual image or drop the two tags.
  - `pages/growkits.astro`: delete the `HowTo` schema (Google retired HowTo rich results) and the `Product` schemas (products live in the shop; P4.1 adds proper ones there).
  - `pages/unsere-pilze.astro`: delete the `Product` schemas (fresh mushrooms aren't sold online, no offers).
  - `pages/tinkturen.astro`, `pages/gastronomie.astro`, `components/FAQ.astro`: keep their schemas, but every `image`/`url` must be absolute (`new URL(x, Astro.site).href`). `FAQPage` stays.
  - JSON-LD output: escape `<` as `<` in all `set:html={JSON.stringify(...)}` (add one helper `jsonLd(obj)` in `apps/website/src/utils/json-ld.ts` and use it everywhere).
  Commit: `fix(website): valid structured data, drop dead meta`

- [x] **P1.3 Delete dead code and unused assets** · deps: — · verify: quick · 872e2de
  Grep before every delete (include `public/admin/config.yml` and all apps); keep anything still referenced and report it.
  - Components: `apps/website/src/components/{CustomerDeliverySection,ImageGallery,UpcomingDates}.astro`; `packages/ui/src/{PageHero,SvgHeading}.astro` (+ their `exports` in `packages/ui/package.json`); `apps/storefront/src/modules/common/components/{CartTotals,LineItemRow}.tsx`; `apps/website/src/utils/color.ts`.
  - `packages/ui/src/site.ts`: unused `navLinks`, `footerLinks`.
  - `apps/storefront/src/middleware.ts`: never-called `addSecurityHeaders`.
  - `apps/storefront/public/_headers` (Netlify format; Caddy serves the site).
  - Images in `apps/website/src/assets/images/`: `1000017806.jpg`, `1000018331.jpg`, `black pearl.jpg`, `black_pearl.jpg`, `pioppino-1.jpg`, `pioppino2.jpg`, `rosenseitling_seite.jpg`, `shroom-mates-drawing.png`, `white_pearl.jpg`, `white_pearl_rotate.mov`.
  Commit: `chore(repo): remove dead components, helpers and unused images`

- [x] **P1.4 Real 404s and friendly errors in the shop** · deps: — · verify: quick · f339c6a
  `Astro.redirect("/not-found")` in `apps/storefront/src/layouts/Layout.astro` and `pages/[countryCode]/store/[handle].astro` targets a route that doesn't exist: use `return Astro.rewrite("/404")`. On the product page, replace `{error.message}` in the error banner with German copy ("Das Produkt konnte gerade nicht geladen werden. Bitte versuch es gleich noch einmal.") and keep logging the error server-side. Same pattern anywhere else a raw `error.message` reaches the page (grep `error.message` in `src/pages` and `.astro` files; React checkout components are out of scope).
  Commit: `fix(shop): proper 404s, no raw error messages`

## P2 Tooling and tests

- [x] **P2.1 Lint and type-check the storefront and UI package** · deps: P1.3 · verify: quick · 42d5a1b
  Move Biome config to the repo root (`biome.json`, same version 2.2.6, devDependency at root) covering `apps/*`, `packages/*`, `e2e/` (not `backend/`, not `docs/`). Keep each package's current indentation via `overrides` (website: tabs; storefront, packages/ui: whatever they use now) so formatting doesn't churn every line. Add `lint` scripts (`biome check .`) to storefront and packages/ui; change storefront `build` to `astro check && astro build` (add `@astrojs/check` devDependency). Run `biome check --write`, then fix remaining lint and type errors properly (no blanket rule disables; a narrowly scoped disable with a reason comment is OK for generated or vendor-shaped code). Update the format hook path assumptions if needed (`.claude/hooks/format.sh` finds the nearest `biome.json` upwards and runs the root binary).
  Commit: `chore(repo): biome and astro check for all workspaces`

- [x] **P2.2 CI covers what we verify locally** · deps: P2.1 · verify: quick · 2e4a8c1
  `.github/workflows/ci.yml`: pin bun to `1.3.10` (matches `packageManager`), lint all workspaces (`bun run --filter '*' lint`), build all, add a `test-backend-unit` step (`npm run test:unit`). Keep the integration-test job. Pin bun the same way in `deploy-staging.yml` and `deploy-server.yml` (only that change there). Validate YAML with `bunx --bun yaml-lint` or `npx -y @action-validator/cli` if available offline; otherwise careful review.
  Commit: `ci: lint all workspaces, unit tests, pinned bun`

- [x] **P2.3 Unit tests for the cart-completion guard** · deps: — · verify: backend · 2516bd7
  `backend/src/workflows/hooks/complete-cart-validate.ts` protects against 0 € orders and payments for a different amount, and has no tests. Pure refactor first: move the body into an exported function `validateCartForCompletion(cart, { manualAllowed })` in `backend/src/workflows/hooks/validate-cart-for-completion.ts` (same behaviour, same error types/messages); the hook calls it. Then add `backend/src/workflows/hooks/__tests__/validate-cart-for-completion.unit.spec.ts` covering: no items → INVALID_DATA; no processable sessions → passes; manual provider when not allowed → NOT_ALLOWED; two sessions → mismatch; session amount ≠ cart total → mismatch; currency mismatch → mismatch; BigNumber raw amounts equal → passes; happy path. `npm ci` in `backend/` first if `node_modules` is missing.
  Commit: `test(backend): unit tests for cart completion guard`

## P3 One source of truth for content

- [x] **P3.1 Shop facts in one module** · deps: P1.3 · verify: visual · c373202
  Shipping prices/durations appear hardcoded in `modules/layout/components/Header.astro`, `CartSidebar.tsx`, `modules/store/components/StoreCatalog.astro`, `pages/[countryCode]/store/[handle].astro` (twice). Create `packages/ui/src/shop-facts.ts` (exported as `@shroom-mates/ui/shop-facts`) with `SHIPPING = { standard: { price: "4,95 €", time: "3–5 Werktage" }, express: { price: "9,95 €", time: "1–2 Werktage" }, region: "innerhalb Deutschlands" }` and use it everywhere; rendered text must stay byte-identical. Leave `packages/ui/src/legal/agb.md` as is but add a follow-up note that it must be updated by hand when prices change.
  Commit: `refactor(shop): shipping facts from one module`

- [x] **P3.2 Growkit data as CMS fields, no Markdown parsing** · deps: P1.2 · verify: visual · 9f6600b
  `apps/website/src/pages/growkits.astro` hardcodes `kitMeta` (tone, shop handle, level, temp, pins, sort) and regex-parses each growkit's Markdown body ("Spezielle Tipps", "Verwendung", intro). Move all of it into frontmatter of `src/content/growkits/*.md`: `order` (existing), `tone` (`pink|lavender|olive-soft`), `shopHandle`, `level`, `temperature`, `firstPins`, `intro`, `tips: string[]`, `usage` (string, may contain the same inline HTML as today). Copy texts verbatim from the current bodies; bodies become empty or are removed. Update the zod schema in `src/content.config.ts` and the Sveltia config `public/admin/config.yml` (list widgets for `tips`, select for `tone`). Delete `kitMeta`, `inlineMd`, `paragraphs` and the section parsing. Keep `set:html` only where the CMS field is documented as HTML. Rendered page must be visually identical.
  Commit: `refactor(website): growkit data as CMS fields`

- [x] **P3.3 Growkit guide as CMS fields** · deps: P3.2 · verify: visual · bf9e7e3
  Same for `src/content/growkits-page/content.md`: the guide heading, intro and `### n. Step` sections become frontmatter `guide: { title, intro: string[], steps: [{ title, text: string[] }] }`; move `guideHarvestImageAlt` usage so the harvest photo is chosen by a `photo: boolean` (or image field) on the step instead of a title regex. Update schema + Sveltia config; delete the remaining parser code and the `<PageContent />` fallback. Visually identical.
  Commit: `refactor(website): growkit guide as CMS fields`

- [x] **P3.4 Über-uns sections as CMS fields** · deps: P1.2 · verify: visual · d64fa29
  `src/pages/ueber-uns.astro` parses Markdown sections by heading (`section("Wer wir sind")` etc.). Move them into frontmatter fields of `src/content/about-us-page/content.md` (schema + Sveltia config), copy text verbatim, delete the parser. Visually identical.
  Commit: `refactor(website): about page sections as CMS fields`

- [x] **P3.5 Growkit facts on the product page from Medusa metadata** · deps: P3.1 · verify: visual · 579e1ba
  `pages/[countryCode]/store/[handle].astro` shows "Erste Ernte nach bis zu 3 Wochen, ideal 16–20 °C" for every growkit (wrong for Rosenseitling: bis 28 °C). Read `metadata.temperatur` and `metadata.erste_ernte` (strings) and render the line only when present: `Erste Ernte {erste_ernte}, ideal {temperatur}`. Move `growSteps` into `@shroom-mates/ui/shop-facts` as `GROW_STEPS` (text unchanged). Add the metadata to `backend/src/scripts/seed.ts` and to `e2e/mock/mock-medusa.mjs` with the values from the growkit CMS files (Rosenseitling: "nach 2–4 Tagen"/"bis 28 °C" style; take exact values from `apps/website/src/content/growkits/*.md` after P3.2). Re-baseline allowed only for `shop-produkt-growkit-*` and only if the sole difference is this line; list it in the report. Follow-up for humans: enter the metadata for live products in Medusa Admin.
  Commit: `feat(shop): growkit facts from product metadata`

## P4 Shop SEO

- [x] **P4.1 Product structured data, breadcrumbs, caching** · deps: P1.4 · verify: quick · 06ca9d6
  On the product page emit `Product` JSON-LD with `name`, `description`, absolute `image` URLs, `sku` (variant SKU if present), `brand` (shroom-mates), and `offers` (one `Offer` per variant or an `AggregateOffer`): `price` from `calculated_price.calculated_amount` (decimal with dot), `priceCurrency` EUR, `availability` InStock/OutOfStock from `inventory_quantity` (treat missing as InStock), `url` canonical, `itemCondition` NewCondition, `shippingDetails` (DE, standard rate from `SHIPPING`) and `hasMerchantReturnPolicy` (DE, 14 days, `MerchantReturnFiniteReturnWindow`, by mail). Add `BreadcrumbList` matching the visible crumbs. Use a shared `jsonLd()` helper (copy or move the one from P1.2 into `packages/ui/src/json-ld.ts`). Catalog page: `ItemList` of product URLs. Add `Cache-Control: public, max-age=60, stale-while-revalidate=600` to catalog and product responses (`Astro.response.headers`). Cache `listProducts(region)` in memory for 5 minutes in `src/lib/data/products.ts` (the related-products block fetches the whole catalogue on every request). Verify the JSON-LD by building and fetching a product page from the built server against the mock (`node dist/server/entry.mjs` + `curl`), and check that the JSON parses.
  Commit: `feat(shop): product structured data and response caching`

- [x] **P4.2 Shop sitemap and robots** · deps: P4.1 · verify: quick · 7a608e4
  Add `src/pages/sitemap.xml.ts` (SSR endpoint) listing the catalog and all product URLs with `lastmod` from `updated_at`, and `public/robots.txt` (allow all; disallow cart, checkout, order, vertrag-widerrufen; `Sitemap:` absolute URL from `Astro.site`). Add `<meta name="robots" content="noindex">` where it's missing on non-indexable pages (check order, vertrag-widerrufen). `isStaticOrInternalPath` in the middleware must let `/sitemap.xml` and `/robots.txt` through (it already lists them; verify).
  Commit: `feat(shop): sitemap and robots.txt`

## P5 Front-end diet (performance, maintainability)

- [x] **P5.1 CSS view transitions instead of ClientRouter** · deps: P1.3 · verify: visual · f91aed9
  Remove `<ClientRouter />` from both layouts and use `@view-transition { navigation: auto; }` in `packages/ui/src/base.css` (inside `prefers-reduced-motion: no-preference`). Delete the fallback-transition script and its CSS in `apps/website/src/layouts/Layout.astro`. Simplify every script that listens to `astro:page-load`/`astro:after-swap`/`DOMContentLoaded` (grep all apps + packages/ui) to plain module code that runs once (module scripts run after parse). The cart state no longer survives navigations in memory: make `initCart()` render the header count instantly from a `sessionStorage` snapshot (`cart_snapshot`: `{ id, count }`) and then refresh from the API. Check the React islands still hydrate on every page and the toast/fly-to-cart still work (start the mock + built storefront and click through with Playwright or curl as appropriate).
  Commit: `perf(ui): native view transitions, drop ClientRouter`

- [x] **P5.2 Sticky header without JS-measured offsets** · deps: P5.1 · verify: visual · a0d5b07
  `LayoutScripts.astro` measures the fixed header with a ResizeObserver and writes `--navbar-height`; pages pad themselves with it. Switch the header to `position: sticky; top: 0` and remove the padding/margin offsets that only compensate for the fixed header (`.with-nav-spacing`, page-level `padding-top: var(--navbar-height)`, etc.). `html`/`body` `overflow-x: hidden` breaks sticky: use `overflow-x: clip`. Keep the `scrolled` class (shrinking header) but it must not shift content (header height change must not move the page; if it would, keep a fixed-height wrapper). Remove the height-sync code and the now-unused `--navbar-height*` variables. Full-page screenshots must stay identical; also check the mobile menu (hamburger) still overlays correctly and anchors (`#kits`, `#anleitung`) aren't hidden under the header (`scroll-margin-top`).
  Commit: `refactor(ui): sticky header, no measured offsets`

- [x] **P5.3 Cart smoke test and a thin Store API client** · deps: P5.1 · verify: visual · cea6617
  First write `e2e/smoke/cart.spec.ts` + `e2e/smoke/playwright.config.ts` (reuse the server setup of `e2e/visual/playwright.config.ts`; export it from a shared module instead of copying). Flow against the mock: catalog → product → add to cart → header count = 1 → drawer opens with the item → change quantity → cart page shows it → checkout page renders the address form. Make it pass on the current code and add a `smoke` mode to `scripts/verify.sh` (and include it in `visual` and `all`). Then replace client-side use of `@medusajs/js-sdk` in `src/lib/stores/cart.ts` (and any other browser-side import) with `src/lib/store-api.ts`: a small typed `fetch` wrapper (base URL, publishable key header, JSON, errors with `status`) covering exactly the calls in use. Server-side code (`src/lib/data`, middleware) keeps the SDK. Exported function signatures of the cart store stay identical; payment functions keep their behaviour (rule 5). Smoke + visual must pass; report the new client bundle sizes (`find dist/client -name '*.js'` gzip sizes).
  Commit: `perf(shop): thin store API client in the browser, cart smoke test`

- [x] **P5.4 Header cart button, toast and quick-add without React** · deps: P5.3 · verify: visual · 2099ced
  Rewrite `CartButton.tsx`, `AddedToast.tsx` and the quick-add button in `modules/products/components/product-preview/` as Astro components with module scripts subscribing to the nanostores (`$cartItemCount`, toast store). Same markup, classes, ARIA (live region for the toast, accessible name with count for the button), same fly-to-cart animation. Remove `client:load` usages for them. Smoke + visual must pass.
  Commit: `perf(shop): cart button, toast and quick-add as vanilla islands`

- [x] **P5.5 Cart drawer without React** · deps: P5.4 · verify: visual · cd34640
  Rewrite `CartSidebar.tsx` as an Astro component using a native `<dialog>` (modal, `showModal()`, Escape closes, focus returns to the cart button, inert background handled by the browser), rendering line items from the cart store via a `<template>`. Same look, German copy, quantity stepper and remove buttons with accessible names. After this, React must only load on routes that still need it (checkout, cart page, order, withdrawal form, product options if still React); check with the built bundle that catalog pages no longer load `client.*.js`. Smoke + visual must pass (drawer open state isn't in the baseline: compare it by eye against a screenshot of the old drawer, which you take first and attach the path to in your report).
  Commit: `perf(shop): cart drawer as native dialog`

- [!] **P5.6 Product image carousel with CSS scroll-snap** · deps: P5.1 · verify: visual
  Replace `ImageCarousel.tsx` with an Astro component: horizontal scroll-snap list of `<Image>`s, thumbnail buttons as anchors/buttons that scroll to the image (tiny module script), current-image indicator via IntersectionObserver, keyboard-operable, `aria-label`s in German. No React. Visual must pass.
  Commit: `perf(shop): image carousel without JS framework`

- [x] **P5.7 One mascot-eyes implementation** · deps: P5.1 · verify: visual · c40e867
  The shop 404 uses the React `MatesEyes.tsx`, which duplicates the vanilla gaze logic in `packages/ui` (`MatesLogo.astro`, `scripts/gaze.ts`). Use the shared Astro component on the 404 (add a size/variant prop if needed) and delete `MatesEyes.tsx` and `public/mascot.webp` if unused. Visual must pass for `shop-404-*`.
  Commit: `refactor(shop): shared mascot eyes on 404`

- [x] **P5.8a Tailwind out: layout and common modules** · deps: P5.5 · verify: visual · 361e8c3
  The storefront mixes Tailwind utilities (often with `!` overrides and arbitrary values) with `shop.css`. Goal of P5.8a–d: plain CSS only, like the website. This task: convert every `class`/`className` utility in `modules/layout/**`, `modules/common/**`, `layouts/**`, `pages/*.astro` (not checkout/cart/order) to semantic classes in `src/styles/shop.css` (or scoped `<style>` in `.astro` files) using tokens from `packages/ui/src/tokens.css` (no hex values; `--color-*` aliases are fine where they exist). Use the shared `.btn`/`.pill` utilities from `packages/ui/src/utilities.css` instead of re-creating buttons. Visual must pass.
  Commit: `refactor(shop): plain CSS for layout and common components`

- [x] **P5.8b Tailwind out: store and product modules** · deps: P5.8a · verify: visual · no-op
  Same for `modules/store/**`, `modules/products/**`, `pages/[countryCode]/store/**`, `pages/[countryCode]/index.astro`.
  Commit: `refactor(shop): plain CSS for catalog and product pages`

- [x] **P5.8c Tailwind out: cart, checkout, order, withdrawal** · deps: P5.8b · verify: visual · f96f6d7
  Same for `modules/cart/**`, `modules/checkout/**`, `modules/order/**`, `modules/withdrawal/**` and their pages. Markup/style only; no logic changes (rule 5). Replace the legacy `.btn-accent`/`.btn-outline`/`.btn-ghost` in `src/styles/global.css` with the shared `.btn` variants (add a variant to `utilities.css` if one is missing, matching the current look exactly). Visual + smoke must pass.
  Commit: `refactor(shop): plain CSS for cart and checkout`

- [x] **P5.8d Remove Tailwind** · deps: P5.8c · verify: visual · 3a845ee
  Grep must show no Tailwind utilities left. Remove `tailwindcss`, `@tailwindcss/vite` (package.json, astro.config), `@import "tailwindcss"`, and `packages/ui/src/theme.css` (its aliases already live in `base.css`; move any alias only defined in theme.css into base.css). Update `DESIGN.md` mapping and `.claude/rules/ui.md` mentions of theme.css/Tailwind names. Report CSS bundle size before/after (gzip).
  Commit: `chore(shop): remove Tailwind`

- [x] **P5.9 Token hygiene** · deps: P5.8d · verify: visual · 5974dbc
  In `packages/ui/src/base.css` delete aliases with zero usages (grep each: e.g. `--color-forest*`, `--color-earth*`, `--bg-warm`, …). Replace hardcoded hex colours in `.astro`/`.css` of both apps and packages/ui with the token that has exactly the same value (`#fff` → `var(--white)` etc.). Where no token matches exactly, leave it and list it in the report (design decision for the humans, see DESIGN.md "Rückweg"). Replace the hardcoded `theme-color` in the website layout with the `--bg` value. Visual must pass.
  Commit: `refactor(ui): tokens instead of hex values, drop unused aliases`

- [x] **P5.10 Shared UI patterns** · deps: P5.9 · verify: visual · a1c541c
  Extract what is duplicated in the website pages: identical outline-button variants (`hero__btn--outline`, `pickup__btn--outline`, … → one `.btn--outline` in `utilities.css`), the comic step card (landing `comic-panel` vs growkits `step`, product page `how-card`) into one Astro component in `packages/ui` with the per-page placeholder colours as a prop, the inline check-mark SVG on the product page via `Icon.astro` (add a `check` icon). Only extract where the result is visually identical. Visual must pass.
  Commit: `refactor(ui): shared outline button and step card`

## P6 Privacy guard (stays banner-free)

Research summary (2026-10-19): § 25 TDDDG requires consent for storing/reading on the device unless strictly necessary for a service the user explicitly requested. The cart id in localStorage, the checkout cart id, a stored consent choice and the SumUp widget during checkout fall under that exception; the Google map is already click-to-load. So no cookie banner is needed as long as nothing non-essential is added. Analytics or embedded third-party content without a click would change that.

- [x] **P6.1 Automated privacy guard** · deps: P5.3 · verify: visual · 36b5ced
  Add `e2e/smoke/privacy.spec.ts` (runs in the smoke config): for every route in `e2e/visual/routes.ts` (desktop only) record all requests and assert that no request leaves the site's own origins + the Medusa mock before any user interaction; after load assert `document.cookie` is empty and `localStorage`/`sessionStorage` keys are within an allowlist (`cart_id`, `checkout_cart_id`, `cart_snapshot`, and the map-consent key if one exists). Then click the map's load button on Kontakt and assert Google requests only start after the click. Allowlist constants live in one place with a comment linking § 25 Abs. 2 Nr. 2 TDDDG. Must pass on the current code; if it doesn't, report what violates it (don't "fix" by widening the allowlist).
  Commit: `test(e2e): privacy guard for storage and third-party requests`

## P7 One app, one domain

Target: `apps/web` (renamed from `apps/storefront`) serves everything on `shroom-mates.de`. Marketing pages prerendered (static HTML), shop routes SSR. `apps/website` is removed at the end. URLs:

| Old | New |
|---|---|
| `shroom-mates.de/<page>/` | unchanged |
| `shop.shroom-mates.de/de/store` | `/shop/` |
| `shop.shroom-mates.de/de/store/<handle>` | `/shop/<handle>/` |
| `…/de/cart`, `…/de/checkout`, `…/de/checkout/complete`, `…/de/order/<id>` | `/shop/cart/`, `/shop/checkout/`, `/shop/checkout/complete/`, `/shop/order/<id>/` |
| `…/de/agb`, `…/de/widerruf`, `…/de/gewaehrleistung`, `…/de/vertrag-widerrufen` | `/agb/`, `/widerruf/`, `/gewaehrleistung/`, `/vertrag-widerrufen/` |
| `…/de/datenschutz` (shop privacy) | merged into `/datenschutz/` (P7.6) |

Every old URL 301s to the new one (query strings preserved: SumUp sends buyers back to `/de/checkout/complete?...`). Remove the website's `"/shop": "/kontakt/"` redirect.

- [x] **P7.1 Rename storefront → web** · deps: P5.10, P6.1, P4.2, P3.5 · verify: visual · 2ad6a73
  `git mv apps/storefront apps/web`, package name `@shroom-mates/web`. Update every reference: root/turbo config, Dockerfile path + its internal paths, all `docker-compose*.yml`, `.github/workflows/*.yml`, `.claude/launch.json`, `.claude/rules/storefront.md` (rename to `web.md` with `paths: apps/web/**`), `CLAUDE.md`, `DESIGN.md`, `DEPLOYMENT.md`, `e2e` configs, `scripts/`, `.dockerignore`. No behaviour change. Grep for `storefront` afterwards; leftovers only in historical docs.
  Commit: `chore(repo): rename storefront app to web`

- [x] **P7.2 Drop the country prefix** · deps: P7.1 · verify: visual · 94a3a1d
  Move `src/pages/[countryCode]/**` to the new paths in the table above (shop routes under `src/pages/shop/`, legal pages at the root). Replace `countryCode` params/props everywhere: region = `DEFAULT_REGION` env or the only/first region, resolved once and cached with a 1-hour TTL in `src/lib/data/regions.ts` (single cache; delete the duplicate in the middleware). Middleware: no redirects except the legacy `/de/...` → new URL map (301, query preserved, including `/de/checkout/complete`). `data.redirect_url` for SumUp becomes `<origin>/shop/checkout/complete` (update `.claude/rules/storefront.md`/`web.md` and `docker-compose*.yml` `SUMUP_REDIRECT_URL` defaults; the old path keeps working via the redirect). Update `e2e/visual/routes.ts` URLs (keys unchanged) and all e2e specs. Visual + smoke must pass.
  Commit: `refactor(web): single region, no country prefix in URLs`

- [x] **P7.3 Bring the website into the web app** · deps: P7.2 · verify: visual · 0934437
  Switch `apps/web` to `output: "static"` with the node adapter; every SSR page gets `export const prerender = false` (shop, cart, checkout, order, sitemap endpoint, anything reading cookies/Medusa per request). Move from `apps/website`: `src/pages/*` (prerendered), `src/content/**` + `src/content.config.ts`, `src/components/**`, `src/assets/**`, `src/scripts/**`, `src/styles/global.css`, `public/**` (favicons, robots, manifest, `admin/`), `scripts/copy-cms.mjs` (+ `predev`/`prebuild` hooks), integrations (`@astrojs/mdx`, `@astrojs/sitemap` for the static pages, with the shop sitemap from P4.2 added to the sitemap index). Merge `robots.txt` (one file, both sitemaps, disallow `/admin/`, cart/checkout/order). Sveltia `public/admin/config.yml`: update content/media paths to `apps/web/...`. Config: `site: "https://shroom-mates.de"`, `trailingSlash: "always"`, image settings from the website config, website redirects (minus `/shop`). Keep `apps/website` untouched for now (deleted in P7.5). Visual: update `routes.ts` so web keys point at the web app (one server now) and `VISUAL_SERVERS` in the playwright config; all keys must still match their baselines.
  Commit: `feat(web): marketing pages as prerendered routes of the web app`

- [x] **P7.4 One layout, one header, relative links** · deps: P7.3 · verify: visual · 54a5677
  Merge the two `Layout.astro` into one (website's SEO head as the base; shop pages pass `type="product"`, `noindex`, etc.). The header gets the Pilzkorb button on every page; the ticker vs. info-line difference becomes a prop decided per page group (keep today's choice per page). Remove the cross-origin machinery: `AppId`, `app` props, `linkBuilders`, `external` flags, `websiteUrl`/`shopUrl`/`WEBSITE_URL`/`SHOP_URL`, `PUBLIC_WEBSITE_URL`/`PUBLIC_SHOP_URL` env vars: all links relative. One favicon set (website's), one 404 page (website's design with the mascot), CSP in one place. Expected visual diffs: the header of former website pages now shows the cart button. Before re-baselining, copy `e2e/visual/__screenshots__` to `e2e/visual/__screenshots__.pre-merge/`, run visual, and re-baseline only if every failing key's diff is confined to the header area (check the diff images); list the re-baselined keys in the report.
  Commit: `refactor(web): one layout and header for the whole site`

- [x] **P7.5 Deployment for one app + remove apps/website** · deps: P7.4 · verify: quick · ecd1269
  Caddy (`Caddyfile`, `Caddyfile.test`, `Caddyfile.local`): `shroom-mates.de` reverse_proxies everything to `web:4321` (Astro node standalone serves the prerendered files), keeps the security headers, merges the CSPs (site + SumUp + Medusa API + web3forms + Google map frame), keeps the `/admin/*` CMS CSP and noindex, `Cache-Control: public, max-age=31536000, immutable` for `/_astro/*` and `/assets/*`. `shop.<domain>` becomes a pure redirect host: map old paths to new ones (301, query preserved; anything unmapped → `/shop/`). `api.` unchanged. Compose files (`docker-compose*.yml`): drop the website dist mount, rename the service `storefront` → `web` (keep a compatible health check), `STORE_CORS` must contain the main domain, `SUMUP_REDIRECT_URL` default → `https://shroom-mates.de/shop/checkout/complete`. Do not require new server-side env vars (the staging/production `.env` files can't be changed by the run); where a new var would be needed, default it in compose. Workflows (`ci.yml`, `deploy-staging.yml`, `deploy-server.yml`): build `@shroom-mates/web` only, `docker compose … build medusa web`. Update `DEPLOYMENT.md`, `CLAUDE.md` (Aufbau, Befehle), `DESIGN.md` (paths), `.claude/launch.json`, `apps/web/Dockerfile` (copies content/assets/public). Then `git rm -r apps/website` and fix anything still referencing it. Validate: `caddy validate` if Caddy is installed (else `docker run` is unavailable here, so review carefully), YAML parses, `bun run build` from a clean `apps/web/dist`. Manual follow-ups: DNS stays; Search Console: add new sitemap, keep `shop.` property for the redirect period; update SumUp dashboard redirect if one is configured there.
  Commit: `chore(deploy): single web app behind Caddy, shop subdomain redirects`

- [ ] **P7.6 One privacy policy, updated legal links** · deps: P7.5 · verify: quick
  Merge `packages/ui/src/legal/datenschutz-website.md` and `datenschutz-shop.md` into one `datenschutz.md` rendered at `/datenschutz/`: keep every section of both (no legal content dropped), dedupe identical sections, add a short section "Speicherung im Browser" listing exactly the allowlisted storage keys from P6.1 and their purpose (technically necessary, § 25 Abs. 2 Nr. 2 TDDDG). Mark every sentence you wrote or changed with `<mark class="legal-open">…</mark>` (existing convention) so the humans can have it checked legally. Footer/legal links point to the merged page. Follow-up for humans: legal review of the merged policy and AGB/Widerruf URLs.
  Commit: `docs(legal): one privacy policy for the merged site`

- [ ] **P7.7 Self-hosted Umami analytics (cookieless) + hardened access logs** · deps: P7.6 · verify: visual
  Decided by the user on 2026-10-19: Umami v3, self-hosted on our own server (netcup, 8 GB RAM: enough headroom), no cookies, served from our own domain. Look up exact details (image tags, env vars, tracker attributes) in the official Umami v3 docs; don't guess.
  - **Service** (`docker-compose.yml` and `docker-compose.staging.yml`): `umami` with the official PostgreSQL image pinned to an exact v3 tag, `mem_limit: 768m`, restart policy, health check on `/api/heartbeat`. Database: a separate database `umami` on the existing `postgres` service, same `POSTGRES_USER`/`POSTGRES_PASSWORD`. Existing volumes don't run init scripts, so add a one-shot `umami-db-init` service (postgres image, `restart: "no"`) that creates the database only if it doesn't exist; `umami` depends on it with `condition: service_completed_successfully` and on `postgres` healthy. `APP_SECRET`: optional `UMAMI_APP_SECRET`, falling back to `COOKIE_SECRET` if compose supports nested defaults (`${UMAMI_APP_SECRET:-${COOKIE_SECRET}}`; verify), otherwise `COOKIE_SECRET` + follow-up. No other new required env vars.
  - **Public surface = tracker only.** Caddy (main site block in `Caddyfile`, `Caddyfile.test`, `Caddyfile.local`) proxies exactly two paths to `umami:3000`: the tracker script and the collect endpoint, renamed via Umami's `TRACKER_SCRIPT_NAME` / `COLLECT_API_ENDPOINT` to `/stats/s.js` and `/stats/e` (or the closest the v3 docs allow). The dashboard is **not** routed publicly: publish `127.0.0.1:3001:3000` on the host only, reached via SSH tunnel. CSP stays `'self'` (same origin).
  - **Tracker in the web app:** rendered in the single Layout only when the build-time env `PUBLIC_UMAMI_WEBSITE_ID` is set (absent → no script at all, so tests, mock and local dev stay analytics-free). `<script defer src="/stats/s.js" data-website-id=… data-host-url="" data-domains="shroom-mates.de" data-do-not-track="true">` plus the v3 options to drop query strings and hashes. URLs with personal IDs must be normalised before sending (`/shop/order/<id>/` → `/shop/order/`, checkout complete without params) via Umami's `data-before-send` hook; the hook lives in a module file (CSP: no inline script). Pass `PUBLIC_UMAMI_WEBSITE_ID` through `apps/web/Dockerfile` as a build arg and compose `build.args` (optional, empty default).
  - **Shop events** (no personal data in event properties; product handle/variant and amounts only): `add-to-cart` (handle, quantity) after a successful `addToCart`, `open-pilzkorb`, `begin-checkout` (cart value), `purchase` on the order-confirmed page (order total + currency EUR as Umami revenue data, no order ID, no email). Call through one tiny helper `track(name, data)` in `src/lib/analytics.ts` that no-ops when `window.umami` is absent. Payment logic itself stays untouched (rule 5): only add the tracking call after success.
  - **Opt-out:** a link "Statistik für diesen Browser deaktivieren" on `/datenschutz/` that sets Umami's documented disable flag (`localStorage` key `umami.disabled`) and shows the state; add that key to the privacy-guard allowlist in P6.1 with a comment (user-initiated, so not consent-relevant).
  - **Access logs** (good practice regardless): JSON access log for the main site block with client IPs masked (`ip_mask` IPv4 /16, IPv6 /32 on `request>remote_ip` and `request>client_ip`), `Cookie` and `Authorization` headers deleted, `roll_keep_for 720h`. Check the Caddy docs for the exact `format filter` grammar.
  - **Backups:** `scripts/backup-postgres.sh` also dumps the `umami` database (same rotation).
  - **Docs:** `DEPLOYMENT.md`: first-run steps (SSH tunnel `ssh -L 3001:127.0.0.1:3001 <user>@<host>`, log in, change the default admin password immediately, create the website, put its ID into `.env` as `PUBLIC_UMAMI_WEBSITE_ID`, redeploy), and how to set up the funnel catalog → product → `add-to-cart` → `begin-checkout` → `purchase` in the dashboard. Placeholders only, no real hosts. One line in `CLAUDE.md` (Aufbau).
  - **Privacy policy** (merged `datenschutz.md`): section "Reichweitenmessung mit Umami": self-hosted on our server, no cookies, no cross-site tracking, no IP storage (country derived and discarded), data collected (page URL without query, referrer, browser, OS, device type, screen size, country, the shop events above), purpose, legal basis Art. 6 Abs. 1 lit. f DSGVO, our § 25 TDDDG assessment, Do-Not-Track respected, opt-out link, retention. Plus a section on the masked access logs. Wrap all new text in `<mark class="legal-open">`.
  - **Tests:** build once with `PUBLIC_UMAMI_WEBSITE_ID=00000000-0000-0000-0000-000000000000` and assert (small Playwright spec in `e2e/smoke/`, run against that build) that the script tag is present, external, same-origin, and that the order page sends a normalised URL (intercept the collect request). Normal `verify.sh visual` (without the env) must stay green and screenshot-identical.
  - **Staging (P8.2):** extend the smoke check: `umami` healthy, `/stats/s.js` returns JavaScript, dashboard not reachable from outside.
  Follow-ups for humans: change the Umami default password on first login; create the website and set `PUBLIC_UMAMI_WEBSITE_ID` on staging and production; set up the funnel; legal review of the new privacy text together with P7.6.
  Commit: `feat(analytics): self-hosted cookieless Umami with shop events`

- [ ] **P7.8 Live preview in Sveltia CMS with the real page design** · deps: P7.5 · verify: visual
  Decided by the user on 2026-10-20: stay with Sveltia (git-based, no extra server), but editors get a live preview that looks exactly like the real page. Approach: Sveltia's preview pane posts the entry being edited to an SSR endpoint of the web app, which renders the real Astro page component with that data; the pane shows the HTML in a sandboxed iframe. No duplicated preview markup.
  - **Pages take data as props.** For every CMS-driven page (landing, unsere-pilze, growkits, tinkturen, gastronomie, ueber-uns, faq; check `content.config.ts` for the full list) move the page body into `src/components/pages/<Name>Page.astro` that receives the entry data (and any related collection, e.g. growkits, mushrooms) as props. The page file in `src/pages/` only loads content and renders the component. Screenshot-identical (verify: visual).
  - **Render endpoint** `src/pages/vorschau/render.ts` (`prerender = false`): `POST` JSON `{ collection, file, data, related? }`, renders the matching `<Name>Page` inside the real Layout with the Astro Container API (`astro/container`; check the Astro 6 docs for the current export name and how to register the renderers/integrations it needs). Validate `data` with the same zod schema as the collection (errors → 422 with a German message listing the fields). Images: field values that resolve to an existing asset (same lookup the content layer uses, e.g. `import.meta.glob` over the content folders) render through `astro:assets`; anything else (new upload not saved yet) renders a neutral placeholder box with the alt text and "Neues Bild – erscheint nach dem Speichern". Strip all `<script>` tags from the output and add `<base href="/">`.
  - **Security:** only accept `Content-Type: application/json` **and** a custom header `X-Preview: 1` (forces a CORS preflight, so other sites can't post to it); reject everything else with 400. Response headers: `Content-Security-Policy: sandbox; default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'`, `X-Robots-Tag: noindex`, `Cache-Control: no-store`. Max body 256 KB. `robots.txt` disallows `/vorschau/`.
  - **Sveltia side:** `public/admin/preview.js` (module file; the admin CSP is `script-src 'self'`) loaded in `public/admin/index.html` after the CMS bundle. It registers a preview template per collection/file with `CMS.registerPreviewTemplate` (check the Sveltia preview-templates API docs at sveltiacms.app for the exact component signature, props such as `entry` and `getAsset`, and how to create elements without JSX). The template renders one `<iframe sandbox="allow-same-origin">` (no `allow-scripts`) and, debounced 400 ms after each change, posts the entry data to `/vorschau/render` and sets `iframe.srcdoc`. Shows a small German status line ("Vorschau wird aktualisiert …" / error text from 422). Mobile/desktop width toggle above the iframe (390 / 1280 px, scaled to fit). Update the admin CSP in Caddy (`frame-src 'self' blob: about:` or whatever srcdoc needs; check) only as far as needed.
  - **Tests:** `e2e/smoke/preview.spec.ts`: posting the current growkits-page data with a changed `heroHeadline` returns HTML containing the new headline and the real page structure (e.g. the kits section); without `X-Preview` → 400; invalid data → 422; response carries the sandbox CSP; output contains no `<script>`. Normal visual must stay identical.
  - **Docs:** one line in `CLAUDE.md` (Aufbau: "Seiten-Markup in `components/pages/*`, Seiten laden nur Daten; CMS-Vorschau über `/vorschau/render`") and the same rule in `.claude/rules/website.md`.
  Follow-up for humans: try the preview in `/admin/` for each page type (can't be automated: Sveltia login).
  Commit: `feat(cms): live preview with the real page design`

## P8 Finish, staging, land

- [ ] **P8.1 Full verification and report** · deps: P7.7, P7.8 · verify: all
  Run `scripts/verify.sh all`. Build both a clean install (`rm -rf node_modules apps/*/node_modules && bun install --frozen-lockfile`) and the production build. Measure: JS and CSS gzip per page type (home, growkits, catalog, product, cart, checkout) before (from the review: website ≈17 KB JS, shop ≈90 KB JS, shop CSS 16 KB) vs. after. Write `docs/plans/overhaul-report.md`: what changed per phase, numbers, deviations, blocked tasks with reasons, every manual follow-up from the Log. Commit it.
  Commit: `docs(plan): overhaul report`

- [ ] **P8.2 Deploy to staging** · deps: P8.1 · verify: —
  Allowed external actions (approved by the user on 2026-10-19): `git push origin overhaul` (only this branch; never `main`/`shop`, never force), `gh workflow run deploy-staging.yml -f branch=overhaul`, `gh run watch`/`gh run view --log-failed`. Never run `deploy-server.yml`. If the run fails: read the failed log, fix in a commit, push, re-dispatch; at most 3 attempts. Server-side `.env.staging` can't be changed: if the failure needs a new env value, mark blocked and describe it. After a green run, smoke-check the staging host with `curl` (home, `/shop/`, one product, `/sitemap-index.xml`, a legacy `shop.` URL redirect) using the host from the workflow log only for this check (never write it into the repo). Report result + run URL.
  Commit (only if fixes were needed): `fix(deploy): <what>`

- [ ] **P8.3 Land on shop** · deps: P8.2 or P8.1 (if P8.2 is blocked) · verify: —
  Main checkout = first entry of `git worktree list` (on branch `shop`; it may have uncommitted files of the humans: never touch, stash, reset or commit them). If `shop` moved since the run started, `git merge shop` into `overhaul` here in the worktree first, resolve conflicts, re-run `scripts/verify.sh quick`. Then in the main checkout: if an untracked file there would be overwritten by the merge (e.g. `e2e/bun.lock`) and it is byte-identical to the version on `overhaul`, delete that untracked copy; otherwise stop and report. Run `git -C <main> merge --ff-only overhaul`. Don't push `shop`. Report the final `shop` SHA.

---

## Log

_(orchestrator appends one line per task: `2026-10-19 23:10 P1.1 DONE abc1234 — note`)_
2026-10-19 23:26 P1.1 DONE 4d81baa — html font-size 106.25%; visual unchanged
2026-10-19 23:27 P1.2 DONE ab82bed — dead meta/schemas removed, jsonLd helper, og size tags dropped
2026-10-19 23:28 P1.3 DONE 872e2de — dead components, helpers, 10 images removed
2026-10-19 23:29 P1.4 DONE f339c6a — rewrite to /404 (verified 404 status), German error copy
2026-10-19 23:40 P2.1 DONE 42d5a1b — root biome, astro check; checkout only reformatted; visual PASS
2026-10-19 23:41 P2.2 DONE 2e4a8c1 — CI lints/builds all, backend unit tests, bun 1.3.10; YAML parses
2026-10-19 23:43 P2.3 DONE 2516bd7 — guard extracted, 8 unit tests green
2026-10-19 23:45 P3.1 DONE c373202 — SHIPPING in @shroom-mates/ui/shop-facts, 4 call sites; visual PASS
2026-10-19 23:48 P3.2 DONE 9f6600b — growkit frontmatter fields; inlineMd/paragraphs kept for guide (P3.3)
2026-10-19 23:51 P3.3 DONE bf9e7e3 — guide as frontmatter, parser and fallback removed
2026-10-19 23:54 P3.4 DONE d64fa29 — about sections as string[] frontmatter, parser removed
2026-10-19 23:57 P3.5 DONE 579e1ba — growkit line from metadata, GROW_STEPS in shop-facts; includes user's P7.7 Umami plan edit
2026-10-19 23:59 P4.1 DONE 06ca9d6 — Product/Breadcrumb/ItemList JSON-LD, Cache-Control, 5-min product cache
2026-10-20 00:00 P4.2 DONE 7a608e4 — SSR sitemap.xml + robots.txt (verified against mock), noindex widerrufen
2026-10-20 00:12 P5.1 DONE f91aed9 — native view transitions; cart count survives nav (orchestrator Playwright check)
2026-10-20 00:23 P5.2 DONE a0d5b07 — sticky header; menu + anchors checked by orchestrator (Playwright)
2026-10-20 00:29 P5.3 DONE cea6617 — smoke test + thin store-api client; SDK out of client bundle
2026-10-20 00:33 P5.4 DONE 2099ced — vanilla CartButton/Toast/QuickAdd; quick-add+toast+fly checked by orchestrator
2026-10-20 00:47 P5.5 DONE cd34640 — native dialog drawer, lazy thumbnails fixed after 1 retry; catalog without React
2026-10-20 00:57 P5.6 BLOCKED — mobile shop-produkt-growkit baseline diff (harness srcset quirk), re-baseline not allowed; parked on failed/P5.6
2026-10-20 01:01 P5.7 DONE c40e867 — shop 404 uses MatesLogo; MatesEyes.tsx still used elsewhere
2026-10-20 01:03 P5.8a DONE 361e8c3 — scope already plain CSS (grep-checked); own .sr-only added
2026-10-20 01:04 P5.8b DONE no-op — scope already semantic classes (worker + orchestrator grep), no commit needed
2026-10-20 01:13 P5.8c DONE f96f6d7 — checkout/cart/order plain CSS; logic identical ignoring className
2026-10-20 01:21 P5.8d DONE 3a845ee — Tailwind removed, mini preflight layer, .sr-only in ui base.css
2026-10-20 01:25 P5.9 DONE 5974dbc — 8 unused aliases removed, exact-match hex → tokens, theme-color from tokens
2026-10-20 01:28 P5.10 DONE a1c541c — shared .btn--outline + check icon; step card not unified (not identical)
2026-10-20 01:31 P6.1 DONE 36b5ced — privacy guard: 18 routes + map click, no violations
2026-10-20 01:34 P7.1 DONE 2ad6a73 — apps/web, service web; leftovers only prose comments
2026-10-20 01:40 P7.2 DONE 94a3a1d — single region, /shop/ URLs, legacy 301s verified with query
2026-10-20 01:47 P7.3 DONE 0934437 — website pages prerendered in apps/web; legacy redirects via /de/[...path] route
2026-10-20 02:02 P7.4 DONE 54a5677 — one Layout/header, relative links, single 404; shop-404 re-baselined
2026-10-20 02:06 P7.5 DONE ecd1269 — one web app behind Caddy, shop. redirect host, apps/website removed
