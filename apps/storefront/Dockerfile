# ── Stage 1: Build ───────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY apps/storefront/package.json ./apps/storefront/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ui ./packages/ui
COPY apps/storefront ./apps/storefront
COPY turbo.json ./

# Install and build
RUN bun install
WORKDIR /app/apps/storefront
RUN bun run build

# ── Stage 2: Production Runtime ──────────────────────────────
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

RUN addgroup --system storefront && adduser --system --ingroup storefront storefront

# Copy built output
COPY --from=builder /app/apps/storefront/dist ./dist

# Install ONLY production deps (no symlinks from builder)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/storefront/package.json ./apps/storefront/
COPY --from=builder /app/packages/ui/package.json ./packages/ui/
COPY --from=builder /app/bun.lock ./
RUN bun install --production

RUN chown -R storefront:storefront /app
USER storefront

EXPOSE 4321

CMD ["bun", "run", "./dist/server/entry.mjs"]
