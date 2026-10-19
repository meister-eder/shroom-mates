/**
 * Seiten für den Screenshot-Vergleich. Der `key` ist der Name der Baseline und
 * bleibt gleich, auch wenn sich URLs ändern (z. B. beim Zusammenlegen von
 * Website und Shop): dann nur `url` anpassen, nie den `key`.
 *
 * `cart: true` legt vorher über den Medusa-Mock einen Pilzkorb mit einem
 * Artikel an (für Pilzkorb- und Kassen-Seite).
 */
export const WEBSITE =
  process.env.VISUAL_WEBSITE_URL ?? "http://localhost:4400";
export const SHOP = process.env.VISUAL_SHOP_URL ?? "http://localhost:8000";
export const MOCK = process.env.VISUAL_MOCK_URL ?? "http://localhost:9010";

export interface VisualRoute {
  key: string;
  url: string;
  cart?: boolean;
}

export const routes: VisualRoute[] = [
  { key: "web-home", url: `${WEBSITE}/` },
  { key: "web-pilze", url: `${WEBSITE}/unsere-pilze/` },
  { key: "web-growkits", url: `${WEBSITE}/growkits/` },
  { key: "web-tinkturen", url: `${WEBSITE}/tinkturen/` },
  { key: "web-gastronomie", url: `${WEBSITE}/gastronomie/` },
  { key: "web-ueber-uns", url: `${WEBSITE}/ueber-uns/` },
  { key: "web-faq", url: `${WEBSITE}/faq/` },
  { key: "web-kontakt", url: `${WEBSITE}/kontakt/` },
  { key: "web-impressum", url: `${WEBSITE}/impressum/` },
  { key: "web-404", url: `${WEBSITE}/gibt-es-nicht/` },
  { key: "shop-katalog", url: `${SHOP}/shop/` },
  {
    key: "shop-produkt-growkit",
    url: `${SHOP}/shop/rosenseitling-growkit/`,
  },
  { key: "shop-produkt-tinktur", url: `${SHOP}/shop/lions-mane-tinktur/` },
  { key: "shop-pilzkorb", url: `${SHOP}/shop/cart/`, cart: true },
  { key: "shop-kasse", url: `${SHOP}/shop/checkout/`, cart: true },
  { key: "shop-agb", url: `${SHOP}/agb/` },
  { key: "shop-widerrufen", url: `${SHOP}/vertrag-widerrufen/` },
  { key: "shop-404", url: `${SHOP}/shop/gibt-es-nicht/` },
];
