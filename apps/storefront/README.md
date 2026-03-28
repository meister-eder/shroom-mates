# Shroom-Mates Storefront

E-Commerce-Storefront für shroom-mates.de, basierend auf [astro-medusa-starter](https://github.com/Bystrol/astro-medusa-starter).

## Tech Stack

- **Astro 6** (SSR mit Node.js-Adapter)
- **React 19** (Islands für Cart, Checkout, Navigation)
- **Tailwind CSS v4**
- **Medusa JS SDK** (Backend-Anbindung)
- **Nanostores** (State Management)
- **Mollie** (Zahlungsanbieter, Redirect-basiert)

## Entwicklung

```bash
# .env erstellen
cp .env.example .env
# Variablen ausfüllen (Backend-URL, Publishable Key, Region)

# Dev-Server starten (Port 8000)
bun run dev
```

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `PUBLIC_MEDUSA_BACKEND_URL` | URL des Medusa-Backends (z.B. `http://localhost:9000`) |
| `PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API Key aus dem Medusa Admin |
| `DEFAULT_REGION` | Standard-Region (`de`) |

Siehe [MIGRATION.md](../../MIGRATION.md) — Phase 3.
