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

The `.pages.yml` configuration file sets up three content collections:

#### 🗞️ Neuigkeiten (News)
- Blog posts and news updates
- Fields: Title, description, date, author, image, content
- Path: `src/content/news/`

#### 🍳 Rezepte (Recipes)
- Mushroom recipes with cooking instructions
- Fields: Title, description, difficulty, cooking time, servings, ingredients, instructions, tips
- Path: `src/content/recipes/`

#### 🍄 Pilzsorten (Mushroom Varieties)
- Information about different mushroom types
- Fields: Name, scientific name, description, image, availability, season, price, characteristics, culinary uses, nutritional info
- Path: `src/content/mushrooms/`

### Media Management

Two media folders are configured:

- **Bilder (Images)**: `src/assets/images/` - Optimized images processed by Astro
- **Öffentliche Dateien (Public Assets)**: `public/assets/` - Static files served directly

### Using Content in Astro

Once you create content through PagesCMS, you can use Astro's [Content Collections](https://docs.astro.build/en/guides/content-collections/) to integrate it into your pages.

Example:
```typescript
import { getCollection } from 'astro:content';

const news = await getCollection('news');
const recipes = await getCollection('recipes');
const mushrooms = await getCollection('mushrooms');
```

## 📝 License

MIT License - feel free to use this code for your own mushroom-related projects!
