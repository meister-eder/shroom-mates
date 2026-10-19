import Medusa from "@medusajs/js-sdk";

const MEDUSA_BACKEND_URL = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL;

// Server-side rendering can reach Medusa directly on the internal network
// (e.g. http://medusa:9000 in Docker). This avoids a round trip through the
// public proxy and works with self-signed certificates on test servers.
// Read at runtime, not inlined at build time.
const MEDUSA_INTERNAL_URL = import.meta.env.SSR
  ? process.env.MEDUSA_INTERNAL_URL
  : undefined;

const MEDUSA_PUBLISHABLE_KEY = import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const isDevEnvironment = import.meta.env.DEV;

if (!MEDUSA_BACKEND_URL) {
  console.warn("PUBLIC_MEDUSA_BACKEND_URL environment variable is not set.");
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_INTERNAL_URL || MEDUSA_BACKEND_URL,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
  debug: isDevEnvironment,
});
