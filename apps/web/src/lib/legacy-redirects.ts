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
