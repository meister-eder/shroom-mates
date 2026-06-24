# ── Stage 1: Install with Bun (avoids npm oclif hang) ───────
FROM oven/bun:1-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
RUN bun install

# ── Stage 2: Build with Node.js (Medusa tools require Node) ──
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY . .

RUN npm run build

# ── Stage 3: Production Runtime ──────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system medusa && adduser --system --ingroup medusa medusa

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/src ./src
COPY --from=builder /app/medusa-config.ts ./
COPY --from=builder /app/tsconfig.json ./

RUN mkdir -p /app/uploads && chown -R medusa:medusa /app

# Medusa server expects admin HTML at ./public/admin but build puts it in .medusa/server/public/admin
RUN mkdir -p /app/public && ln -s /app/.medusa/server/public/admin /app/public/admin

USER medusa

EXPOSE 9000

CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
