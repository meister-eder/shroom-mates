// @ts-check
import { defineConfig } from "astro/config";
import AutoImport from "astro-auto-import";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://shroom-mates.de",
  build: {
    assets: "assets",
  },
  integrations: [
    AutoImport({
      imports: ["./src/components/A.astro"],
    }),
    mdx(),
  ],
});
