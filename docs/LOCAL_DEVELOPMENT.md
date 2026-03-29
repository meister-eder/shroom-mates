# Local Development & Payment Testing Guide

Complete guide for running the shroom-mates store locally and testing payments end-to-end.

---

## Prerequisites

- **Bun** ≥ 1.3 (`curl -fsSL https://bun.sh/install | bash`)
- **Node.js** ≥ 20
- **Docker** & Docker Compose (for Postgres + Redis)
- A **SumUp sandbox account** (see Section 3)

---

## 1. Start Infrastructure

Start Postgres and Redis via Docker:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Verify both are running:

```bash
docker compose -f docker-compose.dev.yml ps
```

You should see `shroom-mates-postgres` and `shroom-mates-redis` both healthy.

---

## 2. Backend Setup

```bash
cd backend
cp .env.template .env
```

The defaults in `.env.template` are already configured for local development. No changes needed for the database, Redis, or CORS settings.

Install dependencies and set up the database:

```bash
bun install
bunx medusa db:create    # Create the database (skip if it already exists)
bunx medusa db:migrate   # Run migrations
bun run seed             # Seed with sample data (products, regions, etc.)
```

Start the backend:

```bash
bun run dev
```

The Medusa backend runs at **http://localhost:9000**. The admin dashboard is at **http://localhost:9000/app**.

### Create an Admin User

If this is your first time:

```bash
bunx medusa user -e admin@example.com -p supersecret
```

Then log in at http://localhost:9000/app.

---

## 3. SumUp Sandbox Setup

### 3.1 Create Sandbox Merchant Account

1. Sign up or log in at [sumup.com](https://me.sumup.com/)
2. Click your **profile icon** (top-right) → **Sandbox Merchant Account**
3. The dashboard switches to sandbox mode (you'll see a "Sandbox" indicator)
4. Note your **sandbox Merchant Code** from Settings → Business Account

### 3.2 Create a Sandbox API Key

1. In sandbox mode, go to **Developers** → **API Keys** (or [developer.sumup.com/api-keys](https://developer.sumup.com/api-keys))
2. Click **Create API Key**
3. Grant the `payments` scope
4. Copy the key immediately — it starts with `sup_sk_...`

### 3.3 Configure Backend Environment

Add these to `backend/.env`:

```env
SUMUP_API_KEY=sup_sk_your_sandbox_key_here
SUMUP_MERCHANT_CODE=MXXXXXX
SUMUP_REDIRECT_URL=http://localhost:8000/de/checkout/complete
```

Restart the backend after changing `.env`.

### 3.4 Enable SumUp for a Region

1. Open the admin dashboard at http://localhost:9000/app
2. Go to **Settings** → **Regions**
3. Select your region (e.g., Germany / EUR)
4. Under **Payment Providers**, enable **sumup**
5. Save

---

## 4. Storefront Setup

```bash
cd apps/storefront
cp .env.example .env
```

You need a **Publishable API Key** from the Medusa admin:

1. Go to http://localhost:9000/app → **Settings** → **API Key Management** → **Publishable API Keys**
2. Copy the key (or create one if none exists)
3. Add it to `apps/storefront/.env`:

```env
PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
DEFAULT_REGION=de
```

Install dependencies and start the storefront:

```bash
bun install
bun run dev
```

The storefront runs at **http://localhost:8000**.

---

## 5. Webhook Setup (Required for SumUp Payments)

SumUp processes payments on their hosted checkout page, then sends a webhook back to your Medusa backend to confirm the payment status. On localhost, SumUp can't reach your machine — you need a tunnel.

### Using ngrok

```bash
# Install ngrok (if not already installed)
brew install ngrok

# Expose your Medusa backend
ngrok http 9000
```

ngrok gives you a public URL like `https://abc123.ngrok-free.app`. Update your `backend/.env`:

```env
MEDUSA_BACKEND_URL=https://abc123.ngrok-free.app
```

> **Important:** Update `MEDUSA_BACKEND_URL` every time you restart ngrok (the URL changes on free plans). The webhook URL is constructed from this value: `{MEDUSA_BACKEND_URL}/hooks/payment/sumup_sumup`.

Restart the backend after updating.

### Alternatives to ngrok

- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (`cloudflared tunnel`)
- [localtunnel](https://github.com/localtunnel/localtunnel) (`npx localtunnel --port 9000`)
- [bore](https://github.com/ekzhang/bore) (`bore local 9000`)

---

## 6. Testing the Full Payment Flow

### 6.1 Happy Path (Successful Payment)

1. Open the storefront at http://localhost:8000
2. Browse products and add something to the cart (any amount except 11.00, 42.01, 42.76, 42.91)
3. Go to Cart → Checkout
4. **Step 1 — Address:** Fill in a shipping address and click Continue
5. **Step 2 — Delivery:** Select a shipping method and click Continue
6. **Step 3 — Payment:** Select **Sumup** as the payment method
7. Click **Place order**

At this point, Medusa creates a SumUp checkout. Because SumUp is a redirect-based provider, the order will be placed and the payment will be captured once the SumUp checkout is completed. In the current storefront flow:

- The `completeCart()` call triggers `authorizePayment` on the backend
- If the SumUp checkout is still `PENDING` (customer hasn't paid on SumUp yet), the status will be `pending`
- Once the customer completes the payment (via the SumUp hosted page), SumUp sends a webhook
- The webhook triggers `capturePayment` on the backend and the order is finalized

### 6.2 Testing with Manual Payment (No Tunnel Needed)

If you just want to test the checkout flow without SumUp:

1. The **Manual Payment** provider (`pp_system_default`) is always available
2. Select it at the payment step
3. Click **Place order** — the order completes immediately
4. This is useful for testing the address, delivery, and order confirmation steps

### 6.3 Test Cards (SumUp Sandbox)

When paying on the SumUp checkout page, use these test cards:

| Brand | Card Number | CVV | Expiry |
|-------|-------------|-----|--------|
| Visa | `4000 0000 0000 0002` | Any 3 digits | Any future date |
| Mastercard | `5200 0000 0000 1005` | Any 3 digits | Any future date |
| Maestro | `6799 9999 9999 9999` | Any 3/4 digits | Any future date |
| AMEX | `3400 0000 0000 009` | Any 4 digits | Any future date |

### 6.4 Testing Payment Failures

| Amount | Result |
|--------|--------|
| Exactly **11.00** (any currency) | Payment always fails |
| **42.01** | Generic card decline |
| **42.76** | Card expired error |
| **42.91** | Do not honor error |

### 6.5 Verifying in Medusa Admin

After a payment completes:

1. Go to http://localhost:9000/app → **Orders**
2. You should see the new order with payment status **Captured**
3. Click into the order to see payment details including `transaction_id`

---

## 7. Quick Reference

### Ports

| Service | URL |
|---------|-----|
| Medusa Backend | http://localhost:9000 |
| Medusa Admin | http://localhost:9000/app |
| Storefront | http://localhost:8000 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

### Start Everything

```bash
# Terminal 1 — Infrastructure
docker compose -f docker-compose.dev.yml up -d

# Terminal 2 — Backend
cd backend && bun run dev

# Terminal 3 — Storefront
cd apps/storefront && bun run dev

# Terminal 4 — Tunnel (only needed for SumUp webhooks)
ngrok http 9000
```

### Environment Files

| File | Purpose |
|------|---------|
| `backend/.env` | Backend config (database, Redis, API keys, CORS) |
| `apps/storefront/.env` | Storefront config (backend URL, publishable key) |

### Useful Commands

```bash
# Reset the database
cd backend && bunx medusa db:migrate --run && bun run seed

# Check Medusa health
curl http://localhost:9000/health

# List payment providers (requires admin auth)
curl http://localhost:9000/admin/payment-providers \
  -H "Authorization: Bearer <jwt>"

# Check Docker services
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f postgres
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED :5432` | Run `docker compose -f docker-compose.dev.yml up -d` |
| Storefront shows "No payment options" | Enable SumUp for the region in Medusa Admin → Settings → Regions |
| SumUp payment stuck in PENDING | Check that ngrok is running and `MEDUSA_BACKEND_URL` points to the ngrok URL |
| `SumUp createCheckout failed (401)` | Verify `SUMUP_API_KEY` starts with `sup_sk_` and was created under the sandbox merchant |
| `pp_sumup_sumup` not in provider list | Ensure `SUMUP_API_KEY` is set in `.env` and backend was restarted |
| Admin login fails | Create a user: `bunx medusa user -e admin@example.com -p supersecret` |
| Storefront can't connect to backend | Check `PUBLIC_MEDUSA_BACKEND_URL` in storefront `.env` and that backend is running |
