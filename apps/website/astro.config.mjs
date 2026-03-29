// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://shroom-mates.de",
  redirects: {
    "/about": "/ueber-uns/",
    "/shrooms": "/unsere-pilze/",
    "/news": "/",
    "/rezepte": "/",
    "/shop": "/kontakt/",
  },
  build: {
    assets: "assets",
    inlineStylesheets: "auto", // Inline small stylesheets for performance
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        quality: 85,
      },
    },
    breakpoints: [320, 640, 768, 1024, 1280, 1600],
  },
  // Performance optimizations
  vite: {
    environments: {
      client: {
        build: {
          rollupOptions: {
            output: {
              manualChunks: {
                vendor: ["astro"],
              },
            },
          },
        },
      },
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        ![
          "https://shroom-mates.de/ueber-uns/",
          "https://shroom-mates.de/about/",
          "https://shroom-mates.de/shrooms/",
          "https://shroom-mates.de/news/",
          "https://shroom-mates.de/rezepte/",
          "https://shroom-mates.de/shop/",
        ].includes(page),
    }),
  ],
});
