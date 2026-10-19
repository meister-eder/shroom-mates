# Deployment — Shroom-Mates

Everything runs with Docker Compose on a single **netcup** VPS (`DEPLOY_HOST`).
Caddy terminates TLS and routes three hostnames:

| Host | Service |
|------|---------|
| `shroom-mates.<domain>` | Website (static files from `apps/website/dist`) |
| `shop.<domain>` | Storefront (Astro SSR, `web:4321`) |
| `api.<domain>` | Medusa API + Admin (`medusa:9000`, admin at `/app`) |

## Environments

| Environment | Domain | Compose file | Caddyfile | How to deploy |
|-------------|--------|--------------|-----------|---------------|
| **netcup-test** (current) | `<DEPLOY_HOST>.sslip.io` | `docker-compose.test.yml` | `Caddyfile.test` (self-signed TLS) | Actions → **Deploy** → Run workflow → pick a branch |
| Production (not live yet) | `shroom-mates.de` | `docker-compose.yml` | `Caddyfile` (Let's Encrypt) | — |
| Local | `localhost` | `docker-compose.dev.yml` (Postgres + Redis only) | — | see `docs/LOCAL_DEVELOPMENT.md` |

`deploy-staging.yml` / `stop-staging.yml` / `docker-compose.staging.yml` are an
older IP-and-port staging setup from the Hetzner days and are currently unused.

[sslip.io](https://sslip.io) is a public wildcard DNS: `shop.1.2.3.4.sslip.io`
resolves to `1.2.3.4`, so the test server gets hostnames without any DNS setup.
Its certificates are self-signed (`tls internal`), so accept the browser warning
once each for `shop.…` and `api.…`.

## Deploying (`.github/workflows/deploy-server.yml`)

Run **Actions → Deploy → Run workflow**, select the branch for both "Use workflow
from" and the `branch` input. With the GitHub CLI:

```bash
gh workflow run deploy-server.yml --ref shop -f branch=shop
gh run watch
```

The workflow:

1. builds website, storefront and backend in CI (fails fast on build errors),
2. rsyncs the repo to `/opt/shroom-mates` (never touches the server's `.env`),
3. writes `SUMUP_API_KEY` / `SUMUP_MERCHANT_CODE` from the `netcup-test`
   environment secrets into the server `.env` (only if **both** are set),
4. rebuilds the `medusa` and `web` images on the server and restarts the stack,
5. smoke-tests `api…/health`, `shop…/de/store` and the website.

Pushes that only touch `apps/website/` take a fast path that just syncs the static build.

**Automatic deploys:** besides the manual run, the workflow also triggers on every
`push` to the `shop` branch that touches `apps/website/**` (this is what deploys
CMS edits, see [Content editing](#content-editing-sveltia-cms)). A push deploys
the pushed commit (`github.sha`); change detection compares the whole pushed range
(`before..sha`), so it takes the website-only fast path only if *none* of the pushed
commits touched anything outside `apps/website/`. Manual runs always do a full deploy.
Deploys are serialized (`concurrency: deploy-production`), so rapid CMS saves queue up.

## Configuration

### GitHub secrets

| Secret | Scope | Purpose |
|--------|-------|---------|
| `DEPLOY_HOST` | repository | Server IP (also forms the sslip.io domain) |
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
```

All URLs (`MEDUSA_BACKEND_URL`, CORS, `SUMUP_MEDUSA_URL`, `SUMUP_REDIRECT_URL`)
are derived from `DOMAIN` in the compose file, so the SumUp redirect always
points at `https://shop.<domain>/de/checkout/complete`.

## SumUp

- The backend uses the `medusa-payment-sumup` plugin (pinned in `backend/package.json`).
  The storefront sends a per-country `redirect_url`; the plugin only accepts it when
  its host matches `SUMUP_REDIRECT_URL`'s host or is listed in `SUMUP_REDIRECT_ALLOWED_HOSTS`.
- Use a **SumUp sandbox merchant** for the test server — no real money moves and
  SumUp's test cards work.
- The provider must be enabled for the region once per database:

  ```bash
  ssh deploy@<DEPLOY_HOST>
  cd /opt/shroom-mates
  docker compose -f docker-compose.test.yml exec medusa npx medusa exec ./src/scripts/enable-sumup.ts
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
(`http://medusa:9000`), so it also works with the self-signed test certificate.

## First-time database seed

```bash
cd /opt/shroom-mates
docker compose -f docker-compose.test.yml exec medusa npx medusa exec ./src/scripts/seed.ts
```

Creates the Deutschland region (19 % VAT, tax-inclusive), products, shipping options
and a publishable API key (copy it into the `MEDUSA_PUBLISHABLE_KEY` secret).

## Operations

```bash
cd /opt/shroom-mates
C="docker compose -f docker-compose.test.yml"

$C ps                       # status
$C logs -f medusa           # logs (or web, caddy)
$C restart medusa           # restart one service
./scripts/backup-postgres.sh
docker image prune -f && docker builder prune -f   # free disk space
```

## Content editing (Sveltia CMS)

The static website is edited with [Sveltia CMS](https://github.com/sveltia/sveltia-cms),
a Git-based CMS with no server of its own: the admin UI is just static files served
with the website.

- **URL:** `https://shroom-mates.<domain>/admin/` (test server: `https://shroom-mates.<DEPLOY_HOST>.sslip.io/admin/`)
- **Backend:** GitHub repo `meister-eder/shroom-mates`, branch `shop`
  (later `main`). Uploaded images go to `apps/website/src/assets/images`.

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
the `push` trigger starts **Deploy** → only `apps/website/` changed, so the
website-only fast path builds the site and rsyncs `dist/` to the server → live after
about 2–3 minutes. Progress: **Actions → Deploy**. Because the CMS commits directly,
pull before working locally on the same branch.

### Switching the branch to `main`

When production moves from `shop` to `main`, change it in two places:
`branch:` in `apps/website/public/admin/config.yml`, `branches:` under `push:` in
`.github/workflows/deploy-server.yml`. If `main` is branch-protected, direct CMS commits need a bypass rule for the editors.

### CSP

`Caddyfile` serves a separate, stricter-scoped Content-Security-Policy for `/admin/*`
that additionally allows `connect-src https://api.github.com` (plus
`raw.githubusercontent.com` / `*.githubusercontent.com`) and `blob:` for image
previews. The CSP of the public site is unchanged. `/admin/*` is also sent with
`Cache-Control: no-cache` (config changes apply immediately) and
`X-Robots-Tag: noindex`. `Caddyfile.test` has no CSP, only the `no-cache` header.
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

1. Point DNS A records for `shroom-mates.de`, `shop.` and `api.` at the server.
2. Create a `production` environment with the **live** SumUp key and merchant code.
3. Parameterise the workflow's `COMPOSE_FILE`, `DOMAIN` and environment name
   (today they are fixed to the test setup) and deploy with `docker-compose.yml`.
4. Run `enable-sumup.ts` against the production database and remove the manual
   test payment provider from the region. As a safety net, `docker-compose.yml`
   sets `ALLOW_MANUAL_PAYMENT=false`: the backend then hides "Manuelle Zahlung
   (Test)" from the shop and refuses to complete carts paid with it.
