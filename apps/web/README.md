# Shroom Mates Web

Website und Onlineshop für shroom-mates.de in einer Astro-App: Marketingseiten werden statisch vorgerendert, die Shop-Routen unter `/shop/` laufen per SSR (Node-Adapter) gegen Medusa.

## Tech Stack

- **Astro 6** (`output: "static"`, SSR-Seiten mit `prerender = false`)
- **React 19** (Inseln für Pilzkorb, Kasse, Navigation)
- **Content Collections** in `src/content/`, gepflegt über Sveltia CMS (`public/admin/`)
- **Medusa JS SDK**, **Nanostores**, SumUp (Widget)
- Tokens und geteilte Komponenten aus `@shroom-mates/ui`

## Entwicklung

```bash
cp .env.example .env     # Backend-URL, Publishable Key, Region
bun run dev              # Port 8000 (kopiert vorher das CMS-Bundle)
bun run build            # astro check + build nach ./dist/
```

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `PUBLIC_MEDUSA_BACKEND_URL` | URL des Medusa-Backends (z.B. `http://localhost:9000`) |
| `PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API Key aus dem Medusa Admin |
| `DEFAULT_REGION` | Standard-Region (`de`) |

Bildverarbeitung: `docs/IMAGE_HANDLING.md`.
