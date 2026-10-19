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

/** Absolute URL to a page in the shop. */
export const shopUrl = (path = "/") => new URL(path, SHOP_URL).toString();

/* ===================================================================
   Redesign: shared navigation model for SiteHeader + Footer.
   Each app builds same-origin links relative and cross-origin links
   absolute, so one component serves website and shop.
   =================================================================== */

export type AppId = "website" | "shop";

export type NavKey =
  | "home"
  | "shop"
  | "pilze"
  | "growkits"
  | "tinkturen"
  | "gastro"
  | "ueber-uns"
  | "faq"
  | "kontakt";

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  /** Link leaves the current app/origin */
  external: boolean;
}

export const INSTAGRAM_URL = "https://www.instagram.com/shroom_mates_le/";
export const REPO_URL = "https://github.com/meister-eder/shroom-mates";
export const ADDRESS = {
  name: "Glasfabrik",
  street: "Franz-Flemming-Straße 25",
  city: "04179 Leipzig-Leutzsch",
} as const;

/**
 * Link builders for one app. `shop("/store")` -> "/de/store" inside the shop,
 * "https://shop…/de/store" on the website; `website("/faq/")` is the reverse.
 */
export function linkBuilders(app: AppId, countryCode = "de") {
  const website = (path = "/") => (app === "website" ? path : websiteUrl(path));
  const shop = (path = "/") =>
    app === "shop" ? `/${countryCode}${path === "/" ? "" : path}` : shopUrl(`/${countryCode}${path === "/" ? "" : path}`);
  return { website, shop, home: app === "website" ? "/" : `/${countryCode}` };
}

/** Main navigation in display order (Kontakt last). */
export function mainNav(app: AppId, countryCode = "de"): NavItem[] {
  const { website, shop } = linkBuilders(app, countryCode);
  const w = app !== "website";
  const s = app !== "shop";
  return [
    { key: "shop", label: "Shop", href: shop("/store"), external: s },
    { key: "pilze", label: "Unsere Pilze", href: website("/unsere-pilze/"), external: w },
    { key: "growkits", label: "Growkits", href: website("/growkits/"), external: w },
    { key: "tinkturen", label: "Tinkturen", href: website("/tinkturen/"), external: w },
    { key: "gastro", label: "Gastronomie", href: website("/gastronomie/"), external: w },
    { key: "ueber-uns", label: "Über uns", href: website("/ueber-uns/"), external: w },
    { key: "faq", label: "FAQ", href: website("/faq/"), external: w },
    { key: "kontakt", label: "Kontakt", href: website("/kontakt/"), external: w },
  ];
}

export interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}

/** Footer link columns. `legalExtended` adds AGB / Widerruf / Gewährleistung (default: shop only). */
export function footerColumns(
  app: AppId,
  countryCode = "de",
  legalExtended = app === "shop",
): FooterColumn[] {
  const { website, shop } = linkBuilders(app, countryCode);
  const w = app !== "website";
  const s = app !== "shop";
  const legal: FooterColumn["links"] = [
    { label: "Impressum", href: website("/impressum/"), external: w },
    {
      label: "Datenschutz",
      href: app === "shop" ? shop("/datenschutz") : "/datenschutz/",
    },
  ];
  if (legalExtended) {
    legal.push(
      { label: "AGB", href: shop("/agb"), external: s },
      { label: "Widerruf", href: shop("/widerruf"), external: s },
      { label: "Gewährleistung", href: shop("/gewaehrleistung"), external: s },
    );
  }
  return [
    {
      title: "Seiten",
      links: [
        { label: "Shop", href: shop("/store"), external: s },
        { label: "Unsere Pilze", href: website("/unsere-pilze/"), external: w },
        { label: "Growkits", href: website("/growkits/"), external: w },
        { label: "Tinkturen", href: website("/tinkturen/"), external: w },
        { label: "Gastronomie", href: website("/gastronomie/"), external: w },
      ],
    },
    {
      title: "Mehr",
      links: [
        { label: "Über uns", href: website("/ueber-uns/"), external: w },
        { label: "FAQ", href: website("/faq/"), external: w },
        ...legal,
      ],
    },
  ];
}
