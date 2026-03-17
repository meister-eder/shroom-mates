# 🍄 Shroom-Mates

Geschäftswebsite für [shroom-mates.de](https://shroom-mates.de), ein Leipziger Unternehmen für die Kultivierung von Edelpilzen. Wir sind spezialisiert auf den Anbau hochwertiger, regional kultivierter Speisepilze.


## 🚀 Project Structure

```text
/
├── public/
│   └── assets/headings/     # SVG heading assets
├── src/
│   ├── assets/
│   │   └── images/          # Processed images (optimized by Astro)
│   ├── components/          # Reusable Astro components
│   │   ├── ProductCard.astro    # Shared product/mushroom card layout
│   │   ├── Header.astro         # Site header with shrinking navbar
│   │   ├── Footer.astro         # Site footer
│   │   └── ...                  # Section & UI components
│   ├── content/             # Content collections (Astro Content Layer)
│   │   ├── config.ts            # Collection schemas
│   │   ├── mushrooms/           # Mushroom product entries
│   │   ├── growkits/            # Growkit product entries
│   │   ├── tinkturen/           # Tincture product entries
│   │   └── ...                  # Page content (landing, FAQ, etc.)
│   ├── layouts/
│   │   └── Layout.astro     # Main page layout
│   ├── pages/               # Route pages
│   ├── scripts/             # Client-side TypeScript
│   │   ├── hamburger.ts         # Mobile navigation
│   │   └── contact-form.ts     # Contact form submission
│   ├── styles/
│   │   └── global.css       # Global styles & design tokens
│   └── utils/
│       └── color.ts         # Color contrast utilities
└── package.json
```

## 🛠️ Tech Stack

- [Astro 5](https://astro.build) (Static Site Generation)
- TypeScript (strict mode)
- [Bun](https://bun.sh) (package manager & runtime)
- [Biome](https://biomejs.dev) (formatting & linting)
- [Sharp](https://sharp.pixelplumbing.com) (image optimization)
- Astro Content Collections (Markdown/MDX content)

## 🧞 Development Commands

| Command                | Action                                           |
| :-------------------- | :----------------------------------------------- |
| `bun install`         | Installs dependencies                            |
| `bun run dev`         | Starts local dev server at `localhost:4321`      |
| `bun run build`       | Type-check & build production site to `./dist/`  |
| `bun run preview`     | Preview build locally                            |

## 📝 Content Management with PagesCMS

This project is configured to work with [PagesCMS](https://pagescms.org/), a user-friendly content management system that works directly with your GitHub repository.

### Getting Started with PagesCMS

1. Visit [app.pagescms.org](https://app.pagescms.org/)
2. Sign in with your GitHub account
3. Select this repository
4. Start managing your content!
