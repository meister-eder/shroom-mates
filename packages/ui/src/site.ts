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
