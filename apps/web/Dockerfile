# ── Stage 1: Build ───────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

ARG PUBLIC_MEDUSA_BACKEND_URL
ENV PUBLIC_MEDUSA_BACKEND_URL=${PUBLIC_MEDUSA_BACKEND_URL}
ARG PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV PUBLIC_MEDUSA_PUBLISHABLE_KEY=${PUBLIC_MEDUSA_PUBLISHABLE_KEY}
ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}
# Optional: Umami website ID; empty = no tracker in the pages
ARG PUBLIC_UMAMI_WEBSITE_ID=""
ENV PUBLIC_UMAMI_WEBSITE_ID=${PUBLIC_UMAMI_WEBSITE_ID}

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web
COPY turbo.json ./

# Install and build
RUN bun install --backend=copyfile
WORKDIR /app/apps/web
RUN bun run build

# ── Stage 2: Production Runtime ──────────────────────────────
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ARG PUBLIC_MEDUSA_BACKEND_URL
ENV PUBLIC_MEDUSA_BACKEND_URL=${PUBLIC_MEDUSA_BACKEND_URL}
ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}

RUN addgroup --system web && adduser --system --ingroup web web

# Copy built output
COPY --from=builder /app/apps/web/dist ./dist
# SvgHeading reads SVGs from ./public at render time
COPY --from=builder /app/apps/web/public ./public

# Install deps in workspace mode so @shroom-mates/ui resolves
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/packages/ui/package.json ./packages/ui/
COPY --from=builder /app/bun.lock ./
RUN bun install --backend=copyfile

# Merge web deps into root so runtime finds them
RUN for dir in /app/apps/web/node_modules/*; do \
      [ -e "$dir" ] && ln -sf "$dir" "/app/node_modules/$(basename "$dir")"; \
    done

RUN chown -R web:web /app
USER web

EXPOSE 4321

CMD ["bun", "run", "./dist/server/entry.mjs"]
