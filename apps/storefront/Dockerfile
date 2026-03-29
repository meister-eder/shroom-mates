# ── Stage 1: Install Dependencies ────────────────────────────
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./
COPY apps/storefront/package.json ./apps/storefront/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# ── Stage 2: Build ───────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/storefront/node_modules ./apps/storefront/node_modules

# Copy source files
COPY packages/ui ./packages/ui
COPY apps/storefront ./apps/storefront
COPY package.json bun.lock turbo.json ./

# Build astro storefront
WORKDIR /app/apps/storefront
RUN bun run build

# ── Stage 3: Production Runtime ──────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Create non-root user
RUN addgroup --system storefront && adduser --system --ingroup storefront storefront

# Copy built output (Astro standalone mode produces a self-contained server)
COPY --from=builder /app/apps/storefront/dist ./dist
COPY --from=builder /app/apps/storefront/package.json ./

# Copy node_modules required at runtime for the standalone adapter
COPY --from=builder /app/apps/storefront/node_modules ./node_modules

RUN chown -R storefront:storefront /app

USER storefront

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
