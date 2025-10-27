// @ts-check
import { defineConfig } from "astro/config";
import AutoImport from "astro-auto-import";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://shroom-mates.de",
  build: {
    assets: "assets",
    inlineStylesheets: "auto", // Inline small stylesheets for performance
  },
  image: {
    // Configure image optimization
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
    // Define responsive image breakpoints
    breakpoints: [320, 640, 768, 1024, 1280, 1600],
  },
  // Performance optimizations
  vite: {
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
  integrations: [
    AutoImport({
      imports: ["./src/components/A.astro"],
    }),
    mdx(),
    sitemap(),
  ],
});
