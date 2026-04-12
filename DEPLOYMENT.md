# Deployment Guide — Shroom-Mates

This project runs on a single Hetzner VPS using Docker Compose.
Caddy handles TLS termination and reverse proxying automatically via Let's Encrypt.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Hetzner VPS                        │
│                                                      │
│  Caddy (80/443)                                      │
│  ├── shroom-mates.de        → /srv/website (static)  │
│  ├── shop.shroom-mates.de   → storefront:4321        │
│  └── api.shroom-mates.de    → medusa:9000            │
│                                                      │
│  medusa (port 9000)                                  │
│  storefront (port 4321)                              │
│  postgres:16                                         │
│  redis:7                                             │
└─────────────────────────────────────────────────────┘
```

The landing page (`apps/website`) is built to `apps/website/dist/` and served by Caddy
as plain static files — no container restart is needed when only website content changes.

---

## Prerequisites

- Hetzner VPS: Ubuntu 22.04+, min 2 vCPU / 8 GB RAM recommended
- Docker + Docker Compose v2 installed on the server
- `jq` installed on the server (`apt install jq`)
- DNS A records pointing to the VPS IP:
  - `shroom-mates.de`
  - `shop.shroom-mates.de`
  - `api.shroom-mates.de`
- A deploy user with SSH key access and permission to run `docker compose`

---

## GitHub Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `HETZNER_HOST` | VPS public IP or hostname |
| `HETZNER_USER` | SSH user (default: `deploy`) |
| `HETZNER_SSH_KEY` | Private SSH key for the deploy user (full contents of `~/.ssh/id_ed25519`) |

---

## Server Setup (one-time)

### 1. Create deploy user

```bash
adduser deploy
usermod -aG docker deploy
# Paste the deploy user's public key into:
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### 2. Create the app directory

```bash
mkdir -p /opt/shroom-mates
chown deploy:deploy /opt/shroom-mates
```

### 3. Create the `.env` file

```bash
nano /opt/shroom-mates/.env
```

Paste the following, filling in the values:

```dotenv
# Database
POSTGRES_USER=medusa
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=shroom-mates

# Medusa secrets — generate with: openssl rand -base64 32
COOKIE_SECRET=<random-32-byte-secret>
JWT_SECRET=<random-32-byte-secret>

# Payment providers
SUMUP_API_KEY=<your-sumup-api-key>
```

> **Generate secrets**: `openssl rand -base64 32`

---

## First Deploy

After pushing to `main`, the GitHub Actions workflow will:

1. Build all apps (website, storefront, backend)
2. Rsync the entire project to `/opt/shroom-mates/` on the server
3. Run `docker compose up -d` to start all services

The first run will:
- Pull base images (postgres, redis, caddy)
- Build the medusa and storefront Docker images
- Start all services
- Caddy will automatically obtain TLS certificates via ACME

### Seed the database (first-time only)

After the first deploy, run the seed script from the server:

```bash
ssh deploy@<your-vps-ip>
cd /opt/shroom-mates
docker compose exec medusa npx medusa exec ./src/scripts/seed.js
```

This creates:
- German region with 19% VAT (tax-inclusive pricing)
- Product catalog (mushrooms, growkits, tinkturen)
- Standard (€4.95) and Express (€9.95) shipping options

> **Note**: If you re-seed, existing products will be replaced. Customer orders are unaffected.

---

## Ongoing Deployments

All production deploys go through `deploy.yml`, which only fires after CI passes on `main`.

### Full stack deploy

Push to `main` when backend, storefront, or infra files change — `deploy.yml` detects this and runs the full path:
- Rebuilds all Docker images
- Rsyncs changed files
- Restarts services with zero-downtime via `docker compose up -d`

### Website-only deploy

If **all** changed files are under `apps/website/`, `deploy.yml` automatically takes the fast path:
- Builds only the static website
- Rsyncs only the `dist/` folder to `/opt/shroom-mates/apps/website/dist/`
- **No Docker restart needed** — Caddy picks up the new files immediately from the bind mount

### Emergency / manual deploy

Trigger `deploy.yml` manually from the GitHub Actions UI (`workflow_dispatch`). This bypasses the CI gate — useful if CI itself is broken but a hotfix must ship.

---

## Manual Commands

SSH into the server and run these from `/opt/shroom-mates/`:

```bash
# View logs
docker compose logs -f medusa
docker compose logs -f storefront

# Restart a single service
docker compose restart medusa

# Check service health
docker compose ps

# Pull latest images (base images only)
docker compose pull postgres redis caddy

# Rebuild and redeploy manually
docker compose build medusa storefront
docker compose up -d --remove-orphans

# Database backup
./scripts/backup-postgres.sh
```

---

## SumUp Configuration

The storefront uses SumUp's Card Widget (`SumUpCard.mount()`) to process payments.
The widget automatically displays all payment methods enabled on your SumUp account.

**To enable additional payment methods (PayPal, Apple Pay, Google Pay, etc.):**

1. Log in to your [SumUp Dashboard](https://me.sumup.com)
2. Go to **Settings → Payment Methods**
3. Enable the desired methods
4. The widget will show them automatically — no code change needed

**API key**: The `SUMUP_API_KEY` env var must be set to your SumUp API key.
Generate one at **SumUp Dashboard → Developer → API Keys**.

---

## Environment Variables Reference

### Backend (`backend/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Set automatically from `POSTGRES_*` vars |
| `REDIS_URL` | ✅ | Set automatically to `redis://redis:6379` |
| `COOKIE_SECRET` | ✅ | Random 32-byte secret for session cookies |
| `JWT_SECRET` | ✅ | Random 32-byte secret for JWT tokens |
| `MEDUSA_BACKEND_URL` | ✅ | `https://api.shroom-mates.de` |
| `STORE_CORS` | ✅ | `https://shop.shroom-mates.de,https://shroom-mates.de` |
| `ADMIN_CORS` | ✅ | `https://api.shroom-mates.de` |
| `AUTH_CORS` | ✅ | Both CORS origins |
| `SUMUP_API_KEY` | ✅ | From SumUp Dashboard → Developer → API Keys |

### Storefront (`apps/storefront/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_MEDUSA_BACKEND_URL` | ✅ | `https://api.shroom-mates.de` |

---

## Troubleshooting

### Caddy can't obtain TLS certificate

DNS must propagate before the first deploy. Check that all three domains resolve to the VPS IP:
```bash
dig +short shroom-mates.de
dig +short shop.shroom-mates.de
dig +short api.shroom-mates.de
```

### Backend health check failing on first start

Medusa runs database migrations on boot. The `start_period: 30s` in the health check allows time for this.
If it keeps failing, check logs: `docker compose logs medusa`

### Website not updating after website-only deploy

Verify the dist was synced: `ls -lah /opt/shroom-mates/apps/website/dist/`

Caddy serves files directly from the bind mount, so no restart is needed.
If you see a stale cache in the browser, do a hard refresh.

### Out of disk space

The Medusa build creates a `.next` folder that can be large. Clean up old images:
```bash
docker image prune -f
docker builder prune -f
```

---

## Staging Environment

Staging runs on the **same Hetzner server** as production, fully isolated via
separate Docker containers, volumes, and ports. No TLS — access via IP + port.

### Architecture

```
Production (docker-compose.yml)       Staging (docker-compose.staging.yml)
─────────────────────────────────     ─────────────────────────────────────
Caddy → :80/:443                      (no Caddy — direct port access)
  shroom-mates.de (static)            Storefront → :4322
  shop.shroom-mates.de → :4321        Medusa API → :9001
  api.shroom-mates.de  → :9000
Postgres (internal)                   Postgres (internal, separate volume)
Redis (internal)                      Redis (internal, separate volume)
```

### Staging Setup (one-time)

```bash
ssh deploy@<your-vps-ip>

# Create staging directory
mkdir -p /opt/shroom-mates-staging

# Create staging env file
nano /opt/shroom-mates-staging/.env.staging
```

Paste (fill in values — see `.env.staging.example` in the repo):

```dotenv
POSTGRES_USER=medusa
POSTGRES_PASSWORD=<different-password-from-production>
POSTGRES_DB=shroom-mates-staging

COOKIE_SECRET=<openssl-rand-base64-32>
JWT_SECRET=<openssl-rand-base64-32>

MEDUSA_BACKEND_URL=http://<HETZNER_IP>:9001
STORE_CORS=http://<HETZNER_IP>:4322
ADMIN_CORS=http://<HETZNER_IP>:9001
AUTH_CORS=http://<HETZNER_IP>:9001,http://<HETZNER_IP>:4322
```

### Staging Deployment

Staging is **on-demand** — it is not tied to any branch. To start a staging environment:

1. Go to **Actions → Deploy Staging → Run workflow**
2. Enter the branch you want to test (default: `main`)
3. The workflow builds all apps from that branch, rsyncs to `/opt/shroom-mates-staging/`, and starts the stack
4. Verifies all services are healthy

To stop staging when you're done, run **Actions → Stop Staging → Run workflow**. This runs `docker compose down` on the server without deleting volumes.

### Staging Access

- **Storefront**: `http://<HETZNER_IP>:4322`
- **Medusa API**: `http://<HETZNER_IP>:9001/health`
- **Medusa Admin**: `http://<HETZNER_IP>:9001/app`

### Seed the staging database (first-time only)

```bash
ssh deploy@<your-vps-ip>
cd /opt/shroom-mates-staging
docker compose -f docker-compose.staging.yml exec medusa npx medusa exec ./src/scripts/seed.js
```

### Staging Manual Commands

```bash
cd /opt/shroom-mates-staging

# Logs
docker compose -f docker-compose.staging.yml logs -f medusa

# Restart
docker compose -f docker-compose.staging.yml restart medusa

# Tear down (preserves volumes)
docker compose -f docker-compose.staging.yml down

# Tear down + delete all staging data
docker compose -f docker-compose.staging.yml down -v
```

### Branch Strategy

| Trigger | Deploys to | Workflow |
|---------|-----------|----------|
| `main` push (after CI passes) | **Production** — full stack | `deploy.yml` |
| `main` push, website files only | **Production** — static files only, no Docker restart | `deploy.yml` |
| Manual dispatch (any branch) | **Staging** (`:4322` / `:9001`) | `deploy-staging.yml` |
| Manual dispatch | Stops staging | `stop-staging.yml` |
| Any push to `main` / PR to `main` | — | `ci.yml` (lint, build, test) |
