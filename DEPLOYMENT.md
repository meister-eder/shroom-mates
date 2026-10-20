# Deployment — Shroom-Mates

Everything runs with Docker Compose on a single **netcup** VPS (`DEPLOY_HOST`).
Caddy terminates TLS (Let's Encrypt, automatic) and routes these hostnames (one web app serves site and shop):

| Host | Service |
|------|---------|
| `<domain>` | Site + shop (Astro app `web:4321`: prerendered pages, SSR shop under `/shop/`) |
| `shop.<domain>` | Redirects only: old shop URLs (`/de/store/...`, `/de/cart`, ...) 301 to `<domain>/shop/...`; unmapped paths go to `/shop/` |
| `api.<domain>` | Medusa API + Admin (`medusa:9000`, admin at `/app`) |
| `www.<domain>` | Redirect to `<domain>` |

## Environments

One `docker-compose.yml` and one `Caddyfile` for every server environment; they
differ only in variables, set in the `env` block of the deploy workflow:

| Variable | Now (staging) | After go-live |
|----------|---------------|---------------|
| `DOMAIN` | `staging.shroom-mates.de` | `shroom-mates.de` |
| `ROBOTS_TAG` | `noindex, nofollow` (keeps staging out of search engines) | `all` |
| `ALLOW_MANUAL_PAYMENT` | `true` | `false` |
| `CSP_HEADER` | `Content-Security-Policy-Report-Only` | `Content-Security-Policy` (only once the CSP covers Astro's inline island scripts on product, cart and checkout pages; enforced today it would stop React there) |

Today the server is staging; production is still GitHub Pages from `main`. At
go-live the same server becomes production (see [Going to production](#going-to-production)).
Locally: `docker-compose.dev.yml` (Postgres + Redis only), see `docs/LOCAL_DEVELOPMENT.md`.

DNS: `staging` and `*.staging` (A records) point at the server. Caddy fetches and
renews certificates itself; they live in the `caddy_data` volume.

Secrets for the server's `.env`: see `.env.example`.

## Deploying (`.github/workflows/deploy-server.yml`)

Pushes to `shop` deploy automatically when they touch `apps/web`, `packages`,
`backend`, `bun.lock`, `Caddyfile` or `docker-compose.yml`. Manually:
**Actions → Deploy server → Run workflow**, select the branch for both "Use workflow
from" and the `branch` input. With the GitHub CLI:

```bash
gh workflow run deploy-server.yml --ref shop -f branch=shop
gh run watch
```

The workflow:

1. builds the web app and backend in CI (fails fast on build errors),
2. rsyncs the repo to `/opt/shroom-mates` (never touches the server's `.env`),
3. writes `SUMUP_API_KEY` / `SUMUP_MERCHANT_CODE` from the `netcup-test`
   environment secrets into the server `.env` (only if **both** are set),
4. rebuilds the `medusa` and `web` images on the server and restarts the stack,
5. waits for all health checks, then smoke-tests `api…/health`, `/shop/`, the site
   and (on staging) the `noindex` header.

**Automatic deploys:** besides the manual run, the workflow also triggers on every
`push` to the `shop` branch that touches the server stack (this is what deploys
CMS edits, see [Content editing](#content-editing-sveltia-cms)). A push deploys
the pushed commit (`github.sha`). Every deploy is a full deploy because the
prerendered pages are baked into the `web` image.
Deploys are serialized (`concurrency: deploy-server`), so rapid CMS saves queue up.

## Configuration

### GitHub secrets

| Secret | Scope | Purpose |
|--------|-------|---------|
| `DEPLOY_HOST` | repository | Server IP (SSH target) |
| `DEPLOY_USER` | repository | SSH user, default `deploy` |
| `DEPLOY_SSH_KEY` | repository | Private key of the deploy user |
| `MEDUSA_PUBLISHABLE_KEY` | repository | Publishable key baked into the storefront build; must exist in the server database |
| `SUMUP_API_KEY` | environment `netcup-test` | SumUp **sandbox** API key for the test server |
| `SUMUP_MERCHANT_CODE` | environment `netcup-test` | SumUp **sandbox** merchant code |
| `RESEND_API_KEY` | environment `netcup-test` | Resend key with "Sending access" for `shroom-mates.de` (optional; without it emails are only logged) |

Set environment secrets with e.g. `gh secret set SUMUP_API_KEY --env netcup-test`.

### Server `.env` (`/opt/shroom-mates/.env`, owned by `deploy`, mode 600)

```dotenv
POSTGRES_USER=medusa
POSTGRES_PASSWORD=…        # openssl rand -base64 32
POSTGRES_DB=shroom-mates
COOKIE_SECRET=…            # openssl rand -base64 32
JWT_SECRET=…               # openssl rand -base64 32
SUMUP_API_KEY=…            # managed by the workflow (see above)
SUMUP_MERCHANT_CODE=…      # managed by the workflow (see above)
# Optional: extra storefront hosts allowed as SumUp redirect targets (host[:port], comma-separated)
# SUMUP_REDIRECT_ALLOWED_HOSTS=
# Analytics (Umami), see "Analytics" below. Empty = no tracker in the pages.
# PUBLIC_UMAMI_WEBSITE_ID=…
# Optional: Umami APP_SECRET; defaults to COOKIE_SECRET
# UMAMI_APP_SECRET=…
```

All URLs (`MEDUSA_BACKEND_URL`, CORS, `SUMUP_MEDUSA_URL`, `SUMUP_REDIRECT_URL`)
are derived from `DOMAIN` in the compose file, so the SumUp redirect always
points at `https://<domain>/shop/checkout/complete`.

## SumUp

- The backend uses the `medusa-payment-sumup` plugin (pinned in `backend/package.json`).
  The storefront sends a `redirect_url` (`<origin>/shop/checkout/complete`); the plugin only accepts it when
  its host matches `SUMUP_REDIRECT_URL`'s host or is listed in `SUMUP_REDIRECT_ALLOWED_HOSTS`.
- Use a **SumUp sandbox merchant** for the test server — no real money moves and
  SumUp's test cards work.
- The provider must be enabled for the region once per database:

  ```bash
  ssh deploy@<DEPLOY_HOST>
  cd /opt/shroom-mates
  docker compose exec medusa npx medusa exec ./src/scripts/enable-sumup.ts
  ```

  (Or Admin → Settings → Regions → Deutschland → Payment providers.)
- Webhooks: SumUp calls `https://api.<domain>/hooks/payment/sumup_sumup`. With a
  self-signed certificate SumUp probably can't deliver them; orders still complete
  because the storefront completes the cart after payment.
- Enable extra payment methods (Apple Pay, PayPal, …) in the SumUp dashboard under
  Settings → Payment Methods; the card widget shows them automatically.

## Email (Resend)

The backend sends three emails through [Resend](https://resend.com) (`backend/src/modules/resend`,
templates in `backend/src/lib/emails.ts`):

| Event | To | Template |
|-------|----|----------|
| `order.placed` | customer | order confirmation |
| `order.placed` | `SHOP_NOTIFICATION_EMAIL` (default `hey@shroom-mates.de`) | "new order" with admin link |
| `shipment.created` (admin: mark as shipped + tracking number) | customer | shipping confirmation with DHL tracking link |

Sender `EMAIL_FROM` (default `shroom-mates <bestellung@shroom-mates.de>`), replies to
`EMAIL_REPLY_TO` (default `hey@shroom-mates.de`). The domain `shroom-mates.de` must be
verified in Resend (DNS records at Namecheap: MX/SPF on `send`, DKIM on
`resend._domainkey`). Without `RESEND_API_KEY` the built-in local provider only logs
the emails. Preview the rendered emails for the latest order with
`OUT_DIR=/tmp npx medusa exec ./src/scripts/render-emails-preview.ts`.

## Product images

Medusa's local file provider stores uploads in `/app/static` (served at
`https://api.<domain>/static/…`); the `*_medusa_uploads` volume is mounted there so
admin uploads survive rebuilds. The seed product photos live in
`backend/static/seed/` and are baked into the image, so a fresh volume starts with
them. Image URLs are stored absolute in the database — if the API domain changes,
rewrite the `http(s)://old-host` prefix in `image.url` and the `thumbnail` columns.

The storefront optimises product images server-side via Astro's `/_image`
endpoint, which fetches the originals through `MEDUSA_INTERNAL_URL`
(`http://medusa:9000`), so it does not depend on the public certificate.

## First-time database seed

```bash
cd /opt/shroom-mates
docker compose exec medusa npx medusa exec ./src/scripts/seed.ts
```

Creates the Deutschland region (19 % VAT, tax-inclusive), products, shipping options
and a publishable API key (copy it into the `MEDUSA_PUBLISHABLE_KEY` secret).

## Operations

```bash
cd /opt/shroom-mates
C="docker compose"

$C ps                       # status
$C logs -f medusa           # logs (or web, caddy)
$C restart medusa           # restart one service
./scripts/backup-postgres.sh
docker image prune -f && docker builder prune -f   # free disk space
```

## Analytics (Umami, cookieless)

Umami v3 runs as the `umami` service (own database `umami` on the existing
`postgres`; the one-shot `umami-db-init` creates it on first start). Only the
tracker is public: Caddy proxies exactly `/stats/s.js` and `/stats/e` on the main
host to `umami:3000`. The dashboard is **not** routed; it is published on the
server's loopback only (`127.0.0.1:3001`).

First run:

1. Deploy, then open a tunnel: `ssh -L 3001:127.0.0.1:3001 <user>@<host>` and browse to `http://localhost:3001`.
2. Log in with Umami's default account and **change the default admin password immediately**.
3. Settings → Websites → add `shroom-mates.de`; copy the website ID.
4. Put it into the server `.env` as `PUBLIC_UMAMI_WEBSITE_ID=<id>` and redeploy (the ID is baked in at build time; without it the pages contain no tracker).

Funnel (Reports → Funnel): window 1 day, steps in this order:
page `/shop/` (catalog) → page `/shop/` + any product (path starts with `/shop/`) →
event `add-to-cart` → event `begin-checkout` → event `purchase`.
`purchase` carries `revenue` and `currency` (Reports → Revenue). Event data holds only
product handle/variant, quantities and amounts, never order IDs or e-mail addresses.

Notes: the tracker only runs on `shroom-mates.de` (`data-domains`), respects Do-Not-Track and
drops query strings and hashes; `/shop/order/<id>/` is sent as `/shop/order/`. Visitors can opt
out on `/datenschutz/`. `scripts/backup-postgres.sh` dumps the `umami` database too.
The Caddy access log (`/var/log/caddy/access.log` in the `caddy` container, volume `caddy_logs`)
is JSON with masked IPs (IPv4 /16, IPv6 /32), no cookies or auth headers, kept 30 days.
`scripts/test-umami.sh` builds with a dummy website ID and runs the tracker spec.

## Content editing (Sveltia CMS)

The site content is edited with [Sveltia CMS](https://github.com/sveltia/sveltia-cms),
a Git-based CMS with no server of its own: the admin UI is just static files served
with the web app.

- **URL:** `https://<domain>/admin/` (staging: `https://staging.shroom-mates.de/admin/`)
- **Backend:** GitHub repo `meister-eder/shroom-mates`, branch `shop`
  (later `main`). Uploaded images go to `apps/web/src/assets/images`.

### Logging in with a token

1. On GitHub: **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. Resource owner: the account owning the repo. **Repository access: Only select
   repositories → `shroom-mates`**. Set an **expiration date**.
3. Permissions → Repository permissions → **Contents: Read and write** (nothing else).
4. Open `/admin/`, choose **Sign in with Token**, paste the token. The token stays in
   the browser's local storage; use a private device and revoke it on GitHub if lost.

### What happens when you save

Saving (publishing) an entry creates a commit on `shop` via the GitHub API →
the `push` trigger starts **Deploy server** → the full deploy rebuilds the `web` image with the new content → live after
about 5 minutes. Progress: **Actions → Deploy server**. Because the CMS commits directly,
pull before working locally on the same branch.

### Switching the branch to `main`

When production moves from `shop` to `main`, change it in two places:
`branch:` in `apps/web/public/admin/config.yml`, `branches:` under `push:` in
`.github/workflows/deploy-server.yml`. If `main` is branch-protected, direct CMS commits need a bypass rule for the editors.

### CSP

`Caddyfile` serves a separate, stricter-scoped Content-Security-Policy for `/admin/*`
that additionally allows `connect-src https://api.github.com` (plus
`raw.githubusercontent.com` / `*.githubusercontent.com`) and `blob:` for image
previews. The CSP of the public site is unchanged. `/admin/*` is also sent with
`Cache-Control: no-cache` (config changes apply immediately) and
`X-Robots-Tag: noindex`. Staging sends the same CSP as report-only (see `CSP_HEADER`).
If the admin UI shows blocked requests in the browser console, extend the `@admin`
CSP in `Caddyfile`.

### Optional: "Sign in with GitHub" (OAuth)

Not set up. It needs a GitHub OAuth App plus an auth proxy such as
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) (Cloudflare Worker or
self-hosted); then set `base_url` in the `backend` section of `config.yml` to the
proxy and add the proxy origin to the `/admin/*` `connect-src` (and `form-action` if
needed) in `Caddyfile`. Until then, token login is the only online option.

### Local editing

See "Editing website content with Sveltia CMS" in `docs/LOCAL_DEVELOPMENT.md`.

## Going to production

1. Lower the TTL of the existing records a day ahead. Then replace the GitHub Pages
   records of `shroom-mates.de` with A records for `@`, `www`, `shop` and `api`
   pointing at the server.
2. Put the **live** SumUp key and merchant code into the `netcup-test` environment
   secrets (or a new `production` environment referenced by the workflow).
3. In the workflow `env`: `DOMAIN: shroom-mates.de`, `ROBOTS_TAG: all`,
   `ALLOW_MANUAL_PAYMENT: 'false'`, `CSP_HEADER: Content-Security-Policy` (after
   the CSP fix, check the browser console on staging for violations first). Product image URLs stored with the staging
   host need rewriting (see above).
4. Run `enable-sumup.ts` against the production database and remove the manual
   test payment provider from the region. As a safety net, `docker-compose.yml`
   sets `ALLOW_MANUAL_PAYMENT=false`: the backend then hides "Manuelle Zahlung
   (Test)" from the shop and refuses to complete carts paid with it.
