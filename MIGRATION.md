# Migration: Shroom-Mates E-Commerce

Phasenplan für die Migration von einer statischen Astro-Website zu einer vollständigen, selbst gehosteten E-Commerce-Plattform.

> **Stand:** März 2026
> **Stack:** Astro · Medusa v2 · Mollie · Caddy · Hetzner
> **Repo:** Turborepo-Monorepo mit bun-Workspaces

---

## Phase 1 — Monorepo-Einrichtung ✅

**Ziel:** Bestehende Astro-Website in eine Turborepo-Monorepo-Struktur überführen und Platzhalter für Storefront und Backend anlegen.

### Aufgaben

- [x] Astro-Website nach `apps/website/` verschieben (`git mv`, History erhalten)
- [x] `apps/website/package.json` umbenennen zu `@shroom-mates/website`
- [x] Root `package.json` mit bun-Workspaces (`"workspaces": ["apps/*"]`)
- [x] `turbo.json` mit Pipelines: `build`, `dev`, `preview`
- [x] `turbo` als Root-Dev-Dependency installiert
- [x] Root `.gitignore` (node_modules, .turbo, dist, .astro, .env, bun.lockb)
- [x] `apps/storefront/README.md` — Platzhalter
- [x] `backend/README.md` — Platzhalter
- [x] GitHub Actions Workflow auf `path: apps/website` aktualisiert
- [x] `bunx turbo build` erfolgreich (Website baut fehlerfrei)

### Risiken / Offene Fragen

- GitHub Pages Deployment wird in Phase 5 durch Hetzner-Deploy ersetzt — bis dahin bleibt der aktuelle Workflow bestehen
- `sharp` musste als explizite Dependency in `apps/website/` hinzugefügt werden (bun-Workspace-Hoisting)

---

## Phase 2 — Medusa Backend

**Ziel:** Medusa v2 Backend in `backend/` aufsetzen mit lokaler Entwicklungsumgebung, Produktkatalog und Mollie-Zahlungsanbieter.

### Aufgaben

- [ ] Medusa v2 in `backend/` initialisieren (`bunx create-medusa-app`)
- [ ] `backend/` zu Workspace hinzufügen oder als eigenständiges Projekt pflegen (Medusa nutzt eigene `package.json`)
- [ ] Docker Compose für lokale Entwicklung erstellen:
  - Postgres 16
  - Redis 7
- [ ] Medusa Admin Dashboard konfigurieren und testen
- [ ] Mollie als Zahlungsanbieter einrichten:
  - Plugin: `@variablevic/mollie-payments-medusa`
  - Mollie API-Schlüssel als Umgebungsvariable
- [ ] Produktkatalog anlegen:
  - Pilzzuchtzubehör. Masters mix bag, flüssigkulturen
  - Growkits
  - Tinkturen (Lion's Mane, Reishi-Cordyceps)
- [ ] Regionen konfigurieren:
  - nur Deutschland (DE) — Standard
- [ ] Steuersätze definieren:
  - 19% MwSt. für Deutschland
  - wir schicken nur innerhalb deutschlands
- [ ] Produktbilder: Lokales Dateisystem als Upload-Provider (kein S3, kein Object Storage)
- [ ] Versandoptionen definieren (DHL, ggf. DPD)
- [ ] CORS konfigurieren: `http://localhost:8000` (Storefront-Dev) erlauben

### Risiken / Offene Fragen

- **Medusa v2 + bun:** Medusa ist auf Node.js optimiert. `create-medusa-app` könnte mit bun Probleme machen → ggf. `node` direkt für Backend verwenden, Rest des Monorepos bleibt bei bun
- **Mollie-Plugin:** `@variablevic/mollie-payments-medusa` ist ein Community-Plugin, nicht offiziell von Medusa gepflegt — vor Produktivbetrieb gründlich testen, ggf. eigene Zahlungs-Integration als Fallback planen
- **OSS-Verfahren:** Ab 10.000€ EU-weitem Umsatz greifen die One-Stop-Shop-Regeln — Steuersätze der Zielländer müssen hinterlegt werden. Für den Start reicht die deutsche MwSt.
- **Lokaler Datei-Upload:** Bilder sind nur auf dem Server verfügbar, kein CDN — für den Start ausreichend, später ggf. auf Hetzner Object Storage migrieren
- **Admin Dashboard:** Läuft standardmäßig auf Port 9000 unter `/app` — soll es über eine eigene Subdomain erreichbar sein (z.B. `admin.shroom-mates.de`)? ja subdomain wäre gut

---

## Phase 3 — Storefront

**Ziel:** E-Commerce-Storefront auf Basis von [astro-medusa-starter](https://github.com/Bystrol/astro-medusa-starter) in `apps/storefront/` einrichten, an shroom-mates-Design anpassen, Stripe durch Mollie ersetzen.

### Basis-Starter (Stand: März 2026)

| Eigenschaft | Wert |
|---|---|
| Framework | Astro 6.0.4 |
| UI-Library | React 19 (Islands) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Backend-SDK | `@medusajs/js-sdk` |
| Zahlungen | Stripe (wird entfernt) |
| State | Nanostores |
| Forms | React Hook Form + Zod |
| Deployment | Cloudflare Workers (wird ersetzt) |
| Package Manager | Yarn 4.9.1 (wird migriert) |

### Aufgaben

#### Repo klonen und migrieren

- [ ] `astro-medusa-starter` in `apps/storefront/` klonen
- [ ] Yarn 4 → bun migrieren:
  - `.yarnrc.yml` entfernen
  - `yarn.lock` entfernen
  - `.pnp.*` entfernen (falls vorhanden)
  - `"packageManager": "yarn@4.9.1"` aus `package.json` entfernen
  - `bun install` ausführen
  - Alle Scripts prüfen (yarn → bun)
- [ ] `package.json` umbenennen zu `@shroom-mates/storefront`
- [ ] In Root-Workspaces einbinden (`apps/*` deckt es bereits ab)

#### Stripe entfernen

- [ ] Dependencies deinstallieren: `@stripe/react-stripe-js`, `@stripe/stripe-js`
- [ ] `PUBLIC_STRIPE_KEY` aus `.env.example` entfernen
- [ ] Stripe-spezifische Komponenten entfernen/ersetzen:
  - `src/modules/checkout/components/PaymentStep.tsx` — Stripe-Logik entfernen
  - `src/modules/checkout/components/CheckoutPage.tsx` — Stripe Elements entfernen
  - Alle `pp_stripe_*` Provider-Referenzen entfernen

#### Mollie integrieren

- [ ] Mollie-Checkout-Flow implementieren:
  - Mollie-Payment-Session über Medusa SDK initialisieren
  - Weiterleitung zu Mollie Hosted Checkout
  - Rückleitung und Bestätigungsseite
- [ ] Mollie-spezifische Zahlungsarten: iDEAL, Kreditkarte, PayPal, SEPA-Lastschrift, Klarna
- [ ] Umgebungsvariablen: `PUBLIC_MOLLIE_PROFILE_ID` (falls client-seitig nötig)

#### Adapter wechseln

- [ ] `@astrojs/cloudflare` deinstallieren
- [ ] `@astrojs/node` installieren und in `astro.config.mjs` konfigurieren
- [ ] `wrangler.jsonc` entfernen
- [ ] `imageService: "compile"` durch Sharp-basierte Optimierung ersetzen
- [ ] Server-Output-Modus: `output: "server"` (SSR für dynamische Seiten)

#### Bilder

- [ ] S3-Domain-Konfiguration entfernen
- [ ] `image.domains` auf Medusa-Backend-URL beschränken (`api.shroom-mates.de`)
- [ ] Produktbilder werden direkt vom Medusa-Backend geladen (lokaler Upload-Provider)

#### Astro-Version angleichen

- [ ] Website (`apps/website/`) auf Astro 6 upgraden, damit beide Apps die gleiche Version nutzen
- [ ] Breaking Changes prüfen: [Astro 6 Upgrade Guide](https://docs.astro.build/en/guides/upgrade-to/v6/)
- [ ] Content Collections API-Änderungen beachten (v5 → v6)

### Risiken / Offene Fragen

- **Astro 5 → 6 Upgrade der Website:** Content Collections API hat sich geändert — sorgfältig testen, ob alle 9 Seiten korrekt bauen
- **Mollie-Checkout:** Kein fertiges Frontend-SDK wie Stripe Elements — der Checkout-Flow muss als Hosted Checkout (Redirect) implementiert werden. Weniger Kontrolle über das UI, dafür einfacher und PCI-DSS-konform
- **React-Bundle-Größe:** Der Storefront nutzt React 19 für Cart/Checkout/Nav — das sind ~40kB gzipped. Akzeptabel für den Shop, aber die Website sollte weiterhin zero-JS bleiben
- **Yarn → bun Migration:** Prüfen ob alle Dependencies korrekt auflösen, besonders `@medusajs/js-sdk` und `nanostores`
- **Country-Code-Routing:** Der Starter nutzt `/:countryCode/` Prefix — für den deutschen Markt ggf. `/de/` als Standard setzen oder Routing vereinfachen

---

## Phase 4 — Design-Konsistenz

**Ziel:** Website und Storefront visuell identisch gestalten durch ein gemeinsames UI-Paket mit geteilten Komponenten und Design-Tokens.

### Design-Tokens der Website (aktuell in `apps/website/src/styles/global.css`)

```css
/* Farben */
--accent: #ff4908;
--accent-light: #ff9c7e;
--accent-dark: #bf2300;
--text-color: #1d1d1d;
--bg-color: #ffffff;
--bg-accent: #fdfcea;
--focus-color: #5f5f5f;

/* Navbar */
--navbar-height: 7.5rem;
--navbar-height-scrolled: 5.5rem;
--navbar-height-mobile: 4.5rem;
--navbar-height-mobile-scrolled: 3.5rem;

/* Fonts */
Geist Sans (Body)
DM Mono (Footer-Links, Code)

/* Animation Easing */
cubic-bezier(0.22, 1, 0.36, 1)
```

### Aufgaben

#### Shared UI-Paket erstellen

- [x] `packages/ui/` anlegen als internes Workspace-Paket (`@shroom-mates/ui`)
- [x] Tailwind v4 Theme-Konfiguration mit den Website-Design-Tokens:
  ```css
  @theme {
    --color-accent: #ff4908;
    --color-accent-light: #ff9c7e;
    --color-accent-dark: #bf2300;
    --color-text: #1d1d1d;
    --color-bg: #ffffff;
    --color-bg-accent: #fdfcea;
    --font-body: "Geist Sans", system-ui, sans-serif;
    --font-mono: "DM Mono", monospace;
  }
  ```
- [x] Root `package.json` Workspaces erweitern: `["apps/*", "packages/*"]`

#### Komponenten teilen

- [x] Header/Navbar als geteilte Astro-Komponente:
  - Logo (SVG, zentriert)
  - Navigation: Unsere Pilze, Growkits, Tinkturen, Gastronomie, FAQ, Kontakt
  - Shop-Link hinzufügen (→ `shop.shroom-mates.de`)
  - Mobile Hamburger-Menü
  - Scroll-Shrink-Verhalten
- [x] Footer als geteilte Astro-Komponente:
  - Copyright mit Accent-Farbe
  - Navigations-Links (DM Mono, Underline-Animation)
  - Checkered-Background-Pattern
- [x] Gemeinsame CSS-Utilities:
  - `.sr-only` (Screen Reader)
  - `.btn`, `.btn--primary`, `.btn--secondary`
  - `.section`, `.section--checkered`
  - `.card` mit Hover-Effekt
  - Reveal-Animationen (fade, slide, scale)

#### Storefront anpassen

- [x] Storefront-Navigation durch geteilte Navbar ersetzen (mit Shop- und Warenkorb-Erweiterung)
- [x] Storefront-Footer durch geteilten Footer ersetzen
- [x] Geist Sans + DM Mono laden (via `@fontsource/geist-sans`)
- [x] Hintergrund: Checkered Pattern + Grain-Overlay übernehmen
- [x] Produktkarten visuell an `ProductCard.astro` angleichen:
  - Farbige Hintergründe mit dynamischem Text-Kontrast (`readableTextColor()`)
  - Alternierende Layouts (Text links/rechts)
  - Hover: Image-Zoom + Letter-Spacing
- [x] Buttons: Schwarzen Standardstil durch Accent-Orange ersetzen
- [x] Border-Stil: 2–3px solid black (Website-Stil)
- [x] Fokus-Indikatoren: `outline: 2px solid var(--focus-color)`

### Risiken / Offene Fragen

- **Astro-Komponenten zwischen Apps teilen:** Beide Apps müssen `@shroom-mates/ui` als Dependency deklarieren. Astro muss Komponenten aus `node_modules` importieren können — das funktioniert, erfordert aber korrekte `exports` in `packages/ui/package.json`
- **Scoped Styles:** Website nutzt `<style>` Scoping, Storefront nutzt Tailwind-Klassen — im geteilten Paket brauchen wir eine einheitliche Strategie (Tailwind v4 für beide, CSS-Variablen als Brücke)
- **React-Islands im Header:** Storefront-Header braucht einen Cart-Counter (React-Island) — die geteilte Navbar muss einen Slot/Injection-Point dafür bieten
- **Scrollbar-Width Variable:** Die Website setzt `--scrollbar-width` dynamisch via JavaScript in `Layout.astro` — dieses Pattern muss in den Storefront übernommen werden

---

## Phase 5 — Deployment & Infrastruktur

**Ziel:** Alle Services auf einem einzigen Hetzner VPS in Deutschland betreiben. Kein US-basierter Dienst (kein AWS, Cloudflare, Vercel). Vollständig DSGVO-konform.

### Infrastruktur

| Service | Subdomain | Container |
|---|---|---|
| Website (Astro, statisch) | `shroom-mates.de` | Caddy (statische Dateien) |
| Storefront (Astro, SSR) | `shop.shroom-mates.de` | Node.js (Astro-Adapter) |
| Medusa Backend | `api.shroom-mates.de` | Node.js (Medusa v2) |
| Medusa Admin | `api.shroom-mates.de/app` | (Teil des Backends) |
| Postgres 16 | intern | Container |
| Redis 7 | intern | Container |
| Reverse Proxy | alle | Caddy (auto HTTPS) |

**Server:** Hetzner CX32 (4 vCPU, 8 GB RAM, 80 GB SSD) — ca. 7 €/Monat, Standort: Deutschland

### Aufgaben

#### Docker Compose

- [x] `docker-compose.yml` im Repo-Root erstellen:
  ```yaml
  services:
    caddy:        # Reverse Proxy + HTTPS
    postgres:     # Datenbank
    redis:        # Cache / Sessions
    medusa:       # Backend
    storefront:   # Shop (Astro SSR)
  ```
- [x] Caddy-Konfiguration (Caddyfile):
  - `shroom-mates.de` → statische Dateien aus `apps/website/dist/`
  - `shop.shroom-mates.de` → `storefront:4321`
  - `api.shroom-mates.de` → `medusa:9000`
  - Automatisches HTTPS via Let's Encrypt
  - Security-Header (HSTS, CSP, X-Frame-Options)
- [x] Dockerfiles erstellen:
  - `apps/storefront/Dockerfile` (Multi-Stage: bun install → node runtime)
  - `backend/Dockerfile` (Multi-Stage: install → node runtime)
- [x] Volume-Mounts:
  - Postgres-Daten: Named Volume
  - Medusa-Uploads: Bind-Mount für Produktbilder
  - Caddy-Daten: Named Volume (Zertifikate)

#### GitHub Actions CI/CD

- [x] GitHub Pages Workflow entfernen (`.github/workflows/deploy.yml`)
- [x] Neuen CI/CD-Workflow erstellen:
  - Turborepo-Build für alle Apps
  - Docker-Images bauen
  - Per SSH auf Hetzner deployen
  - Zero-Downtime: `docker compose up -d --build` mit Health-Checks
- [ ] Secrets konfigurieren: `HETZNER_SSH_KEY`, `MOLLIE_API_KEY`, `MEDUSA_ADMIN_PASSWORD`

#### DNS & Domain

- [ ] DNS-Einträge bei aktuellem Provider setzen:
  - `A` Record: `shroom-mates.de` → Hetzner-IP
  - `A` Record: `shop.shroom-mates.de` → Hetzner-IP
  - `A` Record: `api.shroom-mates.de` → Hetzner-IP
- [ ] GitHub Pages DNS-Einträge entfernen (falls vorhanden)

#### Backups

- [x] Postgres-Backup-Strategie:
  - Täglicher `pg_dump` via Cron (`scripts/backup-postgres.sh`)
  - Rotation: 7 Tage lokale Backups
  - Optional: Backup auf Hetzner Storage Box (~3 €/Monat)
- [ ] Medusa-Uploads sichern (Produktbilder)

#### Monitoring

- [x] Health-Checks in Docker Compose für alle Services
- [ ] Uptime-Monitoring: Uptime Kuma (Self-Hosted) oder externer EU-Dienst
- [ ] Log-Aggregation: Docker Logs → Lokale Logrotation

### Risiken / Offene Fragen

- **Single Point of Failure:** Ein Server, kein Failover — akzeptabel für den Start, aber Downtime bei Updates oder Hardware-Problemen möglich. Mitigation: Health-Checks, automatischer Restart, regelmäßige Backups
- **Ressourcen CX32:** 4 vCPU / 8 GB RAM sollte für den Start reichen (Medusa + Postgres + Redis + Astro SSR + Caddy). Bei Lastspitzen ggf. auf CX42 upgraden (~13 €/Monat)
- **Zero-Downtime-Deploy:** `docker compose up -d --build` hat eine kurze Downtime beim Container-Restart — für echten Zero-Downtime-Deploy wäre ein Blue/Green-Setup oder Traefik nötig. Für den Start akzeptabel
- **DSGVO:** Alle Daten in Deutschland, kein Transfer in Drittländer. Mollie ist niederländisch (EU) — DSGVO-konform. Datenschutzerklärung und Cookie-Banner aktualisieren
- **SSL-Zertifikate:** Caddy erneuert Let's-Encrypt-Zertifikate automatisch — darauf achten das Port 80 und 443 offen sind
- **Medusa Admin Zugang:** Sollte hinter einer zusätzlichen Authentifizierung stehen (Caddy Basic Auth oder IP-Whitelist) — Medusa's eigene Auth reicht für den Start
- **E-Mail-Versand:** Medusa braucht einen SMTP-Service für Bestellbestätigungen — EU-Anbieter wie Mailjet (FR) oder Brevo (FR) nutzen, kein SendGrid/Mailgun (US)
