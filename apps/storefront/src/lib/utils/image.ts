const PUBLIC_BACKEND_URL = (import.meta.env.PUBLIC_MEDUSA_BACKEND_URL ?? "").replace(/\/+$/, "");

/**
 * Source URL for Astro's <Image>/getImage(). The optimiser fetches the
 * original on the server, so point Medusa-hosted files at the internal
 * backend URL (see MEDUSA_INTERNAL_URL in lib/sdk.ts) when one is set. The
 * browser only ever sees the optimised /_image URL.
 */
export function serverImageSrc(url: string): string {
  const internal = import.meta.env.SSR
    ? process.env.MEDUSA_INTERNAL_URL?.replace(/\/+$/, "")
    : undefined;
  if (!internal || !PUBLIC_BACKEND_URL || !url.startsWith(PUBLIC_BACKEND_URL)) {
    return url;
  }
  return internal + url.slice(PUBLIC_BACKEND_URL.length);
}
