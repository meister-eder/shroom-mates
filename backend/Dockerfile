# ── Stage 1: Install & Build ─────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies with Bun (npm hangs on oclif deps)
RUN bun install

# Copy source
COPY . .

# Build Medusa backend
RUN bun run build

# ── Stage 2: Production Runtime ──────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system medusa && adduser --system --ingroup medusa medusa

# Copy built output and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/src ./src
COPY --from=builder /app/medusa-config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R medusa:medusa /app

USER medusa

EXPOSE 9000

CMD ["npx", "medusa", "start"]
