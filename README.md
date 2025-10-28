# 🍄 Shroom-Mates

Business website for [shroom-mates.de](https://shroom-mates.de), a Leipzig-based gourmet mushroom cultivation company. We specialize in growing high-quality, locally cultivated mushrooms.


## 🚀 Project Structure

```text
/
├── public/
│   └── images/            # Static mushroom images
├── src/
│   ├── assets/
│   │   └── images/       # Processed images and videos
│   ├── components/       # Reusable Astro components
│   ├── data/
│   │   └── mushrooms.ts  # Mushroom database
│   ├── layouts/         # Page layouts
│   ├── pages/          # Route pages
│   ├── scripts/        # Client-side JavaScript
│   └── styles/         # Global CSS styles
└── package.json
```

## 🛠️ Tech Stack

- [Astro](https://astro.build)
- TypeScript
- CSS

## 🧞 Development Commands

| Command                | Action                                           |
| :-------------------- | :----------------------------------------------- |
| `bun install`         | Installs dependencies                            |
| `bun run dev`         | Starts local dev server at `localhost:4321`      |
| `bun run build`       | Build production site to `./dist/`               |
| `bun run preview`     | Preview build locally                            |

## 📝 Content Management with PagesCMS

This project is configured to work with [PagesCMS](https://pagescms.org/), a user-friendly content management system that works directly with your GitHub repository.

### Getting Started with PagesCMS

1. Visit [app.pagescms.org](https://app.pagescms.org/)
2. Sign in with your GitHub account
3. Select this repository
4. Start managing your content!

### Content Collections

The `.pages.yml` configuration file sets up two content collections using Astro's Content Collections feature:

#### 🎯 Werte-Karten (Values)
- Three value cards displayed on the landing page
- Fields: Title (string), Order (number), Description (short text)
- Path: `src/content/values/`
- Files: `nachhaltig.md`, `regional.md`, `transparent.md`

#### 📖 Über Uns (About Us)
- Rich markdown content for the about us section
- Fields: Title (string), Content (markdown with multiple paragraphs)
- Path: `src/content/about-us/content.md`

### Media Management

Two media folders are configured:

- **Bilder (Images)**: `src/assets/images/` - Optimized images processed by Astro
- **Öffentliche Dateien (Public Assets)**: `public/assets/` - Static files served directly

### Using Content in Astro

The content is managed through Astro's Content Collections API with the Content Layer:

```typescript
import { getCollection, getEntry, render } from 'astro:content';

// Get all values (sorted by order)
const values = await getCollection('values');

// Get the about-us content
const aboutUs = await getEntry('about-us', 'content');

// Render the markdown content
const { Content } = await render(aboutUs);
```

The collections are defined in `src/content/config.ts` using the `glob()` loader for local markdown files.

## 📝 License

MIT License - feel free to use this code for your own mushroom-related projects!
