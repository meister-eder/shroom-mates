/**
 * Cross-app URLs. Override per environment (e.g. test deployments) with the
 * PUBLIC_WEBSITE_URL / PUBLIC_SHOP_URL build-time env vars.
 */
export const WEBSITE_URL: string =
  import.meta.env.PUBLIC_WEBSITE_URL || "https://shroom-mates.de";

export const SHOP_URL: string =
  import.meta.env.PUBLIC_SHOP_URL || "https://shop.shroom-mates.de";

export const CONTACT_EMAIL = "hey@shroom-mates.de";

/** Absolute URL to a page on the marketing website. */
export const websiteUrl = (path = "/") => new URL(path, WEBSITE_URL).toString();

type LinkTarget = (path: string) => string;

/** Main navigation (website pages), shared by both headers. */
export function navLinks(toWebsite: LinkTarget) {
  return [
    { label: "Unsere Pilze", href: toWebsite("/unsere-pilze/") },
    { label: "Growkits", href: toWebsite("/growkits/") },
    { label: "Tinkturen", href: toWebsite("/tinkturen/") },
    { label: "Gastronomie", href: toWebsite("/gastronomie/") },
    { label: "FAQ", href: toWebsite("/faq/") },
    { label: "Kontakt", href: toWebsite("/kontakt/") },
  ];
}

/**
 * Footer links, shared by both apps. `toShop` builds shop URLs (legal pages
 * live in the shop), `toWebsite` website URLs.
 */
export function footerLinks(
  toWebsite: LinkTarget,
  toShop: LinkTarget,
  external = { website: false, shop: false },
  /** Each app links its own privacy policy */
  privacy: { href: string; external?: boolean } = { href: toWebsite("/datenschutz/") },
) {
  return [
    { label: "Shop", href: toShop("/de/store"), external: external.shop },
    { label: "Unsere Pilze", href: toWebsite("/unsere-pilze/"), external: external.website },
    { label: "Growkits", href: toWebsite("/growkits/"), external: external.website },
    { label: "Tinkturen", href: toWebsite("/tinkturen/"), external: external.website },
    { label: "FAQ", href: toWebsite("/faq/"), external: external.website },
    { label: "Kontakt", href: toWebsite("/kontakt/"), external: external.website },
    { label: "Impressum", href: toWebsite("/impressum/"), external: external.website },
    { label: "Datenschutz", href: privacy.href, external: privacy.external ?? false },
    { label: "AGB", href: toShop("/de/agb"), external: external.shop },
    { label: "Widerruf", href: toShop("/de/widerruf"), external: external.shop },
    { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, isEmail: true },
  ];
}

/** Absolute URL to a page in the shop. */
export const shopUrl = (path = "/") => new URL(path, SHOP_URL).toString();
