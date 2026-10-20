# Polish nach dem Overhaul

Source: dogfood test of staging.shroom-mates.de (Sonnet tester) plus the owner's own findings, 2026-10-20. Executed autonomously by the `plan-run` orchestrator with `plan-worker` subagents (Sonnet), one task at a time, on branch `polish` (worktree `.claude/worktrees/polish`). Lands on `shop` at the end, then `shop` is pushed (auto-deploys staging).

Scope boundaries and user decisions (2026-10-20):
- Site and shop are one app: **one header, one footer, one look** on every page. The `shop` / `variant="shop"` split from the two-app era goes away wherever it changes what the visitor sees.
- Header: **all 8 nav items stay** (Shop, Unsere Pilze, Growkits, Tinkturen, Gastronomie, Über uns, FAQ, Kontakt) plus Instagram and Pilzkorb, made smaller so they always fit **in one line** down to the hamburger breakpoint. Logo always goes to `/`.
- Top bar: the **marquee (Laufband) on every page**, with a pause button (WCAG 2.2.2); the static shop info line goes away, its texts move into the marquee.
- Health claims on /tinkturen/: soften (HCVO), list every changed sentence for the owner's legal review.
- Finish: fast-forward `shop`, push `shop` (this triggers "Deploy server" → staging), watch the run, up to 3 fix attempts.
- No stack changes, Medusa stays, payment logic keeps its behaviour.

## Status protocol

- `- [ ]` open · `- [x]` done (short commit SHA appended) · `- [!]` blocked (reason in Log)
- A task may start only when every ID in its `deps` is `[x]`. If a dep is `[!]`, mark the task `[!] dep`.
- Only the orchestrator edits checkboxes and the Log. Workers never edit this file.
- Failed work is parked on branch `failed/<ID>` (never `git stash`: the stash is shared with other worktrees).

## Global rules for every task (workers read this section + their own task only)

1. Read `CLAUDE.md`, `DESIGN.md` (rules part) and the `.claude/rules/*.md` matching the files you touch. They win over this plan if they conflict, except where a task explicitly says otherwise.
2. Stay inside the task's scope. No drive-by refactors; note other findings under "Follow-ups" in your report.
3. UI copy stays German. Brand spelling in running text and titles: `shroom-mates` (lowercase). The cart is called **Pilzkorb**. Code comments: match the file.
4. No visual changes unless the task says so. `verify: visual` tasks must pass `scripts/verify.sh visual`. Re-baselining only where the task allows it and only for the keys it names: first copy `e2e/visual/__screenshots__` to `e2e/visual/__screenshots__.pre-<ID>/`, run the visual check, look at the diff images in `e2e/test-results/` and confirm the change is confined to what the task describes, then `scripts/verify.sh baseline` and `scripts/verify.sh visual` again. List the re-baselined keys in the report.
5. Payment logic (`apps/web/src/lib/checkout/`, `initPaymentSession`/`placeOrder` in `src/lib/stores/cart.ts`, `SumUpWidget.tsx`, backend payment hooks) keeps its behaviour. Markup and styles around it may change where a task says so.
6. No new dependencies unless the task names them. Never regenerate lockfiles wholesale.
7. Public repo: no secrets, server IPs, local absolute paths. Never `--no-verify`.
8. Verify with `scripts/verify.sh <mode>`; don't paste logs into the report.
9. Commit once at the end with the task's commit message (+ `Co-Authored-By` trailer). Stage explicit paths; check `git status` first.
10. Report in at most 10 lines: `DONE <sha>` or `BLOCKED <reason>`, verify result, decisions, follow-ups / manual steps.

## Manual follow-ups (collected by the orchestrator for the humans)

- Product image URLs on staging still point at the old sslip host (broken images, and the server IP shows up in the HTML): run the SQL rewrite from the chat of 2026-10-20 / DEPLOYMENT.md "Product images".
- P2.1: quick-add toast works against the mock; confirm on staging with the real backend (slow responses).
- Product descriptions live in Medusa (not in the repo): check them for health claims ("maximale Bioverfügbarkeit") and English fragments ("Hot-water und alkohol-extrahiert") in the Medusa Admin.

---

## P0 Safety net (done during setup)

- [x] **P0.1** Worktree `polish` from `shop` (faa00fa) + merge of `fix/csp-enforce` (enforced-CSP smoke spec); `scripts/verify.sh baseline` taken on the untouched code, `visual` passed twice, `backend` green.

## P1 One header, one footer

- [x] **P1.1 One header for every page** · deps: — · verify: visual
  Remove the shop variant from the header. In `packages/ui/src/SiteHeader.astro` drop `variant`, `info`, `infoCompact` and everything that depends on `isShop` (filtered nav, `home = "/shop/"`, `site-header--shop` styles, the different mobile layout); in `apps/web/src/modules/layout/components/Header.astro` stop passing them. Every page gets today's marketing header: all `mainNav` items, Instagram icon, Pilzkorb pill, logo link `href="/"` with aria-label "shroom-mates Startseite", Kontakt visible. Mobile: today's marketing mobile header (menu button left, wordmark centre, Instagram + Pilzkorb right) and the full mobile menu everywhere. `aria-current` keeps working (shop pages: "shop"). The shop info line (`header-info`) is removed here; its texts move into the marquee in P1.3 (until then shop pages show the marketing marquee). Check legal pages (/agb/, /datenschutz/ …) and checkout too.
  Re-baseline allowed: all `shop-*` keys (header area only). Marketing keys must stay unchanged.
  Commit: `fix(ui): one header for site and shop, logo goes home` · 7c2047b

- [x] **P1.2 Header always fits in one line** · deps: P1.1 · verify: visual
  Today the nav pills keep their full size until the hamburger breakpoint (`max-width: 1240px`) and then barely fit or collide (gap of ~8 px at 1245 px). Make pills, gaps and the wordmark scale fluidly (`clamp()` on font-size, padding, gap; tokens from `packages/ui/src/tokens.css`) so all 8 items + Instagram + Pilzkorb fit in one line with at least 16 px free space at every width from **1024 px** upward; below 1024 px the hamburger menu. Pills stay readable (font-size ≥ 14 px) and keep a 44×44 px target via padding/min-height where the design allows (WCAG 2.5.8 needs ≥ 24 px). Add a Playwright check to the smoke suite (`e2e/smoke/`, run by `scripts/verify.sh smoke`): for widths 1024–1920 in steps of 16 px, the header nav items share one `offsetTop`, nothing overlaps the Pilzkorb pill, and `document.documentElement.scrollWidth <= innerWidth`.
  Re-baseline allowed: all keys, desktop only (header area only; mobile must stay unchanged).
  Commit: `fix(ui): header nav scales down and stays on one line` · c6ff5d2

- [x] **P1.3 Marquee on every page, pausable** · deps: P1.1 · verify: visual
  One list of marquee texts, defined once (where today's marketing `ticker` texts live), containing today's ticker items followed by the former shop info items ("Versand in 3–5 Werktagen", "Selbst gezüchtet in Leipzig", "Sicher bezahlen mit SumUp" and "Versand ab 4,95 €"; take the exact current wording and the shipping price from `packages/ui/src/shop-facts.ts`, don't duplicate the number). Shown on every page. Pausing (WCAG 2.2.2) must not look like an added control (user, 2026-10-20): the marquee pauses on hover, on keyboard focus inside the bar and on tap/click anywhere on the bar (toggle), and there is a very discreet pause/play icon (~14 px, same colour and opacity as the bar text, no pill/border, `aria-pressed`, label "Laufband anhalten"/"Laufband abspielen", visible focus ring only on keyboard focus) at the right end that reads as part of the bar; `prefers-reduced-motion: reduce` keeps it static as today. The duplicated groups stay `aria-hidden`.
  Re-baseline allowed: all keys (bar area only).
  Commit: `feat(ui): marquee on every page with a pause button` · fca8444

- [x] **P1.4 One footer for every page** · deps: P1.1 · verify: visual
  `Footer` loses its `shop` prop: every page gets the same footer with all legal links (Impressum, Datenschutz, AGB, Widerrufsbelehrung, Gewährleistung, Vertrag widerrufen) and links to FAQ and Kontakt; keep today's column structure and look, merge the link lists without duplicates. The WaveRoller (`{!shop && <WaveRoller />}` in `Layout.astro`) shows on every page.
  Re-baseline allowed: all keys (footer area only).
  Commit: `fix(ui): one footer with all legal links` · 9b7b719

- [x] **P1.5 Layout: no shop/site split left that visitors see** · deps: P1.3, P1.4 · verify: visual
  In `apps/web/src/layouts/Layout.astro`: titles `"<page> | shroom-mates"` everywhere (shop pages too, `og:site_name` "shroom-mates"); keep the `shop` prop only where it is technically needed (region lookup, body class for shop styles) and document that in its JSDoc; LocalBusiness and Breadcrumb JSON-LD on every page that is not checkout/cart/order. Remove now-dead CSS for the shop header/footer variants (grep `site-header--shop`, `header-info`, `is-shop` and check each use). No other visual change.
  Commit: `refactor(web): one layout for site and shop` · 39f114d

- [x] **P1.6 Calm, smooth page transitions** · deps: P1.3 · verify: visual
  Today the whole page (`root`) cross-fades in 0.3 s including header and marquee, and the marquee restarts at 0 on every page, which reads as a jerk. Target: header (incl. marquee) gets `view-transition-name: site-header` and does not animate (`::view-transition-group(site-header)`, old/new: `animation: none`), so it stays put; only the content area animates: old content fades out fast (~120 ms), new content fades in with a slight upward move (~200 ms, `cubic-bezier(0.2, 0, 0, 1)`), nothing longer than 250 ms. The marquee continues seamlessly across pages: a tiny blocking script in `<head>` (external file under `apps/web/public/`, no inline script because of the CSP) sets `--ticker-delay: -<Date.now() % duration>ms` on `<html>`, and `.ticker__track` uses `animation-delay: var(--ticker-delay, 0s)`; keep the duration in one place. Respect `prefers-reduced-motion` (no transition, static marquee). Make sure scroll-reveal animations don't double-animate the new page. Check in Chromium with a short Playwright script that navigating / → /growkits/ → /shop/ shows no layout shift of the header (header bounding box identical before and after).
  Visual baselines must stay unchanged (screenshots run with reduced motion).
  Commit: `feat(ui): smoother page transitions, header and marquee stay put` · bbd70c2

- [!] **P1.7 One type scale for page headings** · deps: P1.5 · verify: visual
  The shop index h1 ("shroom shop", 172.8 px) is much larger than the marketing h1s (~107 px). Use the same display heading size and colour rule as the marketing pages (look up the h1 rule of e.g. /unsere-pilze/ and the design tokens; orange only per DESIGN.md rules). Check the other shop headings (product title, cart, checkout) against the same scale and align only clear outliers.
  Re-baseline allowed: `shop-katalog`, `shop-produkt-*`, `shop-pilzkorb`, `shop-kasse` (heading area only).
  Commit: `fix(shop): headings use the site type scale`

## P2 Shop UX

- [x] **P2.1 Quick-add gives visible feedback** · deps: P1.5 · verify: smoke
  On /shop/ the quick-add button only greys out for 1–2 s, then just the badge count changes; the `AddedToast` never shows (`div.toast-region` stays empty). Find why (event name, import, region element on catalog pages) and make the toast appear for quick-add on the catalog and on product cards elsewhere, same as the product page's feedback. The button shows a busy state immediately on click ("Wird hinzugefügt…"). Extend the smoke test: quick-add on /shop/ shows the toast and increments the badge.
  Commit: `fix(shop): quick-add shows the toast` · c70dae5

- [ ] **P2.2 Pilzkorb drawer and pill** · deps: P2.1 · verify: smoke
  Drawer (`CartSidebar`): add a secondary link "Pilzkorb ansehen" → `/shop/cart/` next to "Zur Kasse"; on mobile the line-item price must not touch the right edge (padding). On `/shop/cart/` and `/shop/checkout/` the header Pilzkorb pill is a plain link to `/shop/cart/` instead of opening the drawer. Smoke test: drawer has the link; on /shop/cart/ the pill doesn't open the dialog.
  Commit: `fix(shop): drawer links to the Pilzkorb page`

- [ ] **P2.3 Cart page feels instant** · deps: P2.2 · verify: smoke
  Removing a line or changing quantity on /shop/cart/ greys the row for 4–5 s without feedback. Make quantity change and remove optimistic (update the row and totals immediately, roll back with an error message in a live region if the request fails) and show a small inline spinner while syncing; don't change the cart store's API or any payment function. The initial "Pilzkorb wird geladen…" state gets a skeleton of the expected layout (no layout jump when data arrives). Smoke test: remove a line → row disappears immediately.
  Commit: `perf(shop): optimistic cart updates`

- [x] **P2.4 Wording: Pilzkorb everywhere** · dropped by the user on 2026-10-20: "Körbchen" button texts stay as they are. Do nothing.
  Buttons say "Rein ins Körbchen" (3 places in `apps/web/src`), the cart is called Pilzkorb everywhere else. Change the button label to "In den Pilzkorb" and the success state "Liegt im Körbchen ✓" to "Liegt im Pilzkorb ✓" (also aria-labels and the smoke test selectors). Grep for other "Körbchen" / "Warenkorb" in UI text and align them.
  Re-baseline allowed: `shop-katalog`, `shop-produkt-*` (button text only).
  Commit: `fix(shop): call the cart Pilzkorb everywhere`

- [ ] **P2.5 Checkout form errors are announced** · deps: — · verify: smoke
  Checkout field errors ("E-Mail ist erforderlich") set `aria-invalid` but are not linked to the field: add `aria-describedby` pointing at the message element (stable ids), for every field with a message. No change to validation logic or payment.
  Commit: `fix(checkout): link field errors to their inputs`

- [ ] **P2.6 `/de/` goes to the homepage** · deps: — · verify: quick
  `/de/` and `/de` redirect (301) to `/` instead of `/shop/`, both in the Astro legacy route (`apps/web/src/pages/de/[...path].ts`) and in the Caddy `legacy_shop` snippet if it handles the bare path; all other legacy mappings stay exactly as they are (`/de/store/…` → `/shop/…`, `/de/checkout/complete?…` with query). Validate the Caddyfile with `docker run --rm -e DOMAIN=example.test -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile` if Docker is available, otherwise note it in the report.
  Commit: `fix(web): /de/ redirects to the homepage`

## P3 Content

- [ ] **P3.1 Tinkturen: no health claims** · deps: — · verify: visual
  /tinkturen/ (content in `apps/web/src/content/` and/or `TinkturenPage.astro`) contains health claims not allowed for food supplements under the HCVO (EU 1924/2006), e.g. "entzündungshemmend", "Immunsystem modulieren", "Nervenwachstumsfaktor anregen", "Atemwegsbeschwerden", "verbessertes Ansprechen des Immunsystems" with the Cochrane citation. Rewrite those passages neutrally (tradition, taste, ingredients, extraction, how to use; "in der traditionellen Pilzkunde geschätzt" instead of effects), remove effect claims and disease references, keep the structure and length roughly the same. List every changed sentence before/after in the report under "Follow-up for humans: legal review".
  Re-baseline allowed: `web-tinkturen` (text only).
  Commit: `fix(content): tinctures without health claims (needs legal review)`

- [ ] **P3.2 Copy fixes** · deps: — · verify: visual
  - /kontakt/: heading "DAILY BUSINESS" → German (e.g. "Öffnungszeiten" or what fits the content); the address appears twice ("Besuch" block and "Unser Standort" block): keep it once, the block with the map stays.
  - `OrderConfirmedPage.tsx`: English fragments → German. Leave "Körbchen"/"Pilzkorb" wording as it is everywhere.
  - Naming: "Austernseitlinge" consistently on the Austernseitlinge pages (e.g. "Züchte deine eigenen Austernpilze!" → "Züchte deine eigenen Austernseitlinge!"); grep `Austernpilz` in `apps/web/src`.
  Re-baseline allowed: `web-kontakt`, `web-growkits` (text only).
  Commit: `fix(content): German wording, Kontakt without duplicate address`

## P4 CSP

The enforceable CSP is already in (branch `fix/csp-enforce`, 341686e, merged into `polish` during setup): Caddy allows Astro's inline island scripts by sha256 hash, `e2e/smoke/csp.spec.ts` enforces both Caddyfile policies against the production build and fails on any violation or outdated hash, staging enforces (`CSP_HEADER: Content-Security-Policy`). Every task that touches scripts or `<head>` must keep that spec green (it runs in `verify.sh smoke`); if Astro's inline scripts change, update the hashes in `Caddyfile` the way the spec's failure message says.

- [ ] **P4.1 CSP leftovers from the dogfood test** · deps: P1.6 · verify: smoke
  The report-only run on staging also showed (a) a `frame-src` report "Framing https://staging.shroom-mates.de/<page>/" on every page (something frames the site itself; find it: CMS preview, a prefetch, a browser extension in the tester?), (b) an `unsafe-eval` report on `/shop/checkout/` (SumUp widget from gateway.sumup.com?). Investigate both from the code and the SumUp widget docs; fix (a) if it comes from our code (e.g. `frame-src 'self'` only if we really frame ourselves). For (b): if our code evals, remove it; if it's the SumUp widget, add `'unsafe-eval'` to `script-src` **only for `/shop/checkout/*`** (separate matcher in `Caddyfile`) and extend `csp.spec.ts` accordingly. Note under "Follow-up for humans": test one real checkout with the SumUp sandbox on staging and watch the console.
  Commit: `fix(web): CSP covers checkout and self-framing`

## P5 Finish

- [ ] **P5.1 Full verification and report** · deps: P1.1, P1.2, P1.3, P1.4, P1.5, P1.6, P1.7, P2.1, P2.2, P2.3, P2.4, P2.5, P2.6, P3.1, P3.2, P4.1 · verify: all
  Run `scripts/verify.sh all`, write `docs/plans/polish-report.md`: changes per phase, re-baselined keys, client JS gzip per page type before/after, HCVO text changes (before/after), CSP status, blocked tasks, every manual follow-up.
  Commit: `docs(plan): polish report`

- [ ] **P5.2 Land on shop and deploy staging** · deps: P5.1 · verify: —
  Approved by the user on 2026-10-20. Main checkout = first entry of `git worktree list`; never touch its uncommitted files. If `shop` moved: merge `shop` into `polish` here and re-run `scripts/verify.sh visual`. Then `git -C <main> merge --ff-only polish` and `git -C <main> push origin shop` (this triggers the "Deploy server" workflow to staging.shroom-mates.de). Watch it: `gh run list --branch shop --limit 1`, `gh run watch <id> --exit-status`. On failure: `gh run view <id> --log-failed`, fix on `polish`, verify, fast-forward and push `shop` again; at most 3 attempts; anything needing the server itself (SSH, secrets, database) → blocked with description. After success: `curl` / , /shop/, /growkits/ on staging return 200, header HTML identical on / and /shop/ apart from `aria-current`. Never push `main`, never force-push.
  Commit: — (fixes get their own `fix(deploy): …` commits)

---

## Log

_(orchestrator appends one line per task: `YYYY-MM-DD HH:MM <ID> DONE <sha> — note`)_
2026-10-20 10:51 P1.1 DONE 7c2047b — one header everywhere; 14 shop-* keys re-baselined
2026-10-20 11:01 P1.2 DONE c6ff5d2 — fluid header, hamburger <1024px, header smoke spec; desktop keys re-baselined
2026-10-20 11:06 P1.3 DONE fca8444 — marquee everywhere incl. shop facts; hover/focus/tap pause + discreet toggle; no re-baseline
2026-10-20 11:17 P1.4 DONE 9b7b719 — one footer, all legal links + Kontakt; all keys re-baselined (footer + P1.3 bar)
2026-10-20 11:20 P1.5 DONE 39f114d — one layout; titles | shroom-mates; JSON-LD on all but cart/checkout/order
2026-10-20 11:25 P1.6 DONE bbd70c2 — header static in VT, content fade, marquee phase synced via page-sync.js
2026-10-20 11:27 P1.7 BLOCKED failed/P1.7 — re-baseline denied by permission classifier; shop.css change parked, needs human re-baseline
2026-10-20 11:30 P2.1 DONE c70dae5 — toast already worked after P1.5 (mock); added busy state + smoke test
