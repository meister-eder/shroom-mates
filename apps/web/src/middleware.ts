import { defineMiddleware } from "astro:middleware";

const LEGACY_PAGES = new Set([
  "agb",
  "widerruf",
  "gewaehrleistung",
  "vertrag-widerrufen",
  "datenschutz",
]);

/**
 * Maps an old `/de/...` URL (country prefix) to its new path, or undefined if
 * the path is not a legacy URL. Query strings are appended by the caller.
 */
export function legacyTarget(pathname: string): string | undefined {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "de") return undefined;
  const [, a, b, ...rest] = parts;

  if (!a) return "/shop/";
  if (a === "store") {
    if (!b) return "/shop/";
    return rest.length ? undefined : `/shop/${b}/`;
  }
  if (a === "cart" && !b) return "/shop/cart/";
  if (a === "checkout") {
    if (!b) return "/shop/checkout/";
    return b === "complete" && !rest.length
      ? "/shop/checkout/complete/"
      : undefined;
  }
  if (a === "order" && b && !rest.length) return `/shop/order/${b}/`;
  if (LEGACY_PAGES.has(a) && !b) return `/${a}/`;
  return undefined;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const method = context.request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return next();
  }

  const { pathname, search } = context.url;

  // The old shop host served its catalog at "/" (via /de). Temporary until the
  // marketing home page moves into this app.
  if (pathname === "/") {
    return context.redirect(`/shop/${search}`, 302);
  }

  const target = legacyTarget(pathname);
  if (target) {
    // Relative on purpose: behind the reverse proxy context.url.origin is the
    // internal address, not the public host.
    return context.redirect(`${target}${search}`, 301);
  }

  return next();
});
