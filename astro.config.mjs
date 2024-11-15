// @ts-check
import { defineConfig } from "astro/config";

import AutoImport from "astro-auto-import";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://meister-eder.github.io",
  base: "shroom-mates",
  integrations: [// Make sure the MDX integration is included AFTER astro-auto-import
  AutoImport({
    imports: [
      // Import a component’s default export
      // generates:
      // import A from './src/components/A.astro';
      "./src/components/A.astro",

      {
        // Explicitly alias a default export
        // generates:
        // import { default as B } from './src/components/B.astro';
        "./src/components/B.astro": [["default", "B"]],

        // Import a module’s named exports
        // generates:
        // import { Tweet, YouTube } from 'astro-embed';
        "astro-embed": ["Tweet", "YouTube"],

        // Import all named exports from a module as a namespace
        // generates:
        // import * as Components from './src/components';
        "./src/components": "Components",
      },
    ],
  }), mdx()],
});