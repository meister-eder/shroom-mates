# Deployment — Shroom-Mates

Everything runs with Docker Compose on a single **netcup** VPS (`DEPLOY_HOST`).
Caddy terminates TLS and routes three hostnames:

| Host | Service |
|------|---------|
| `shroom-mates.<domain>` | Website (static files from `apps/website/dist`) |
| `shop.<domain>` | Storefront (Astro SSR, `storefront:4321`) |
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
4. rebuilds the `medusa` and `storefront` images on the server and restarts the stack,
5. smoke-tests `api…/health`, `shop…/de/store` and the website.

Pushes that only touch `apps/website/` take a fast path that just syncs the static build.

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
$C logs -f medusa           # logs (or storefront, caddy)
$C restart medusa           # restart one service
./scripts/backup-postgres.sh
docker image prune -f && docker builder prune -f   # free disk space
```

## Going to production

1. Point DNS A records for `shroom-mates.de`, `shop.` and `api.` at the server.
2. Create a `production` environment with the **live** SumUp key and merchant code.
3. Parameterise the workflow's `COMPOSE_FILE`, `DOMAIN` and environment name
   (today they are fixed to the test setup) and deploy with `docker-compose.yml`.
4. Run `enable-sumup.ts` against the production database and remove the manual
   test payment provider from the region.
