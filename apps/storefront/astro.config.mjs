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
