import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

const { PUBLIC_MEDUSA_BACKEND_URL } = loadEnv(
  process.env.NODE_ENV ?? "",
  process.cwd(),
  "",
);

const medusaBackendDomain = PUBLIC_MEDUSA_BACKEND_URL
  ? new URL(PUBLIC_MEDUSA_BACKEND_URL).hostname
  : undefined;

// https://astro.build/config
export default defineConfig({
  site: "https://shroom-mates.de",
  // Marketing pages are prerendered; shop pages opt out with
  // `export const prerender = false`.
  output: "static",
  trailingSlash: "always",
  redirects: {
    "/about": "/ueber-uns/",
    "/shrooms": "/unsere-pilze/",
    "/news": "/",
    "/rezepte": "/",
  },
  adapter: node({
    mode: "standalone",
  }),
  integrations: [
    react(),
    mdx(),
    sitemap({
      // The shop sitemap (products from Medusa) is an SSR endpoint.
      customSitemaps: ["https://shroom-mates.de/sitemap.xml"],
      filter: (page) => {
        const path = new URL(page).pathname;
        return !(
          path.startsWith("/shop/") ||
          [
            "/about/",
            "/shrooms/",
            "/news/",
            "/rezepte/",
            "/vertrag-widerrufen/",
          ].includes(path)
        );
      },
    }),
  ],
  server: {
    port: 8000,
    host: true,
  },
  vite: {
    // CSP is `script-src 'self'`: never inline hoisted scripts into the HTML.
    build: {
      assetsInlineLimit: 0,
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    ssr: {
      // Bundle @medusajs/js-sdk during SSR — its ESM build has bare
      // directory imports (./admin) that Node's ESM loader rejects.
      // Vite's own resolver handles these correctly when bundling.
      noExternal: ["@medusajs/js-sdk"],
    },
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: { quality: 85 },
    },
    breakpoints: [320, 640, 768, 1024, 1280, 1600],
    domains: [
      ...(medusaBackendDomain ? [medusaBackendDomain] : []),
      "api.shroom-mates.de",
      "localhost",
      // MEDUSA_INTERNAL_URL host (server-side image fetches in Docker)
      "medusa",
    ],
  },
});
