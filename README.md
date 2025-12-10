# 🍄 Shroom-Mates

Geschäftswebsite für [shroom-mates.de](https://shroom-mates.de), ein Leipziger Unternehmen für die Kultivierung von Edelpilzen. Wir sind spezialisiert auf den Anbau hochwertiger, regional kultivierter Speisepilze.


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
