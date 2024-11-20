# 🍄 Shroom-Mates

A website dedicated to edible and medicinal mushrooms, featuring detailed information about their characteristics, cultivation methods, and preparation. Built with Astro and TypeScript.

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

- [Astro](https://astro.build) - Static Site Generator
- TypeScript - Type Safety
- CSS Animations - Smooth transitions and effects
- Responsive Design - Mobile-first approach

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :-------------------- | :----------------------------------------------- |
| `bun install`         | Installs dependencies                            |
| `bun run dev`         | Starts local dev server at `localhost:4321`      |
| `bun run build`       | Build your production site to `./dist/`          |
| `bun run preview`     | Preview your build locally, before deploying     |
| `bun run astro check` | Check for TypeScript errors                      |

## 🌐 Deployment

The site is automatically deployed to GitHub Pages using GitHub Actions. Each push to the main branch triggers a new deployment.

## 📝 License

MIT License - feel free to use this code for your own mushroom-related projects!
