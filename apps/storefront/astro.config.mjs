import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

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
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [react()],
  server: {
    port: 8000,
    host: true,
  },
  vite: {
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    ssr: {
      // Bundle @medusajs/js-sdk during SSR — its ESM build has bare
      // directory imports (./admin) that Node's ESM loader rejects.
      // Vite's own resolver handles these correctly when bundling.
      noExternal: ["@medusajs/js-sdk"],
    },
    plugins: [tailwindcss()],
  },
  image: {
    domains: [
      ...(medusaBackendDomain ? [medusaBackendDomain] : []),
      "api.shroom-mates.de",
      "localhost",
    ],
  },
});
