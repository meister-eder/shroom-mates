/**
 * Seiten für den Screenshot-Vergleich. Der `key` ist der Name der Baseline und
 * bleibt gleich, auch wenn sich URLs ändern (z. B. beim Zusammenlegen von
 * Website und Shop): dann nur `url` anpassen, nie den `key`.
 *
 * `cart: true` legt vorher über den Medusa-Mock einen Pilzkorb mit einem
 * Artikel an (für Pilzkorb- und Kassen-Seite).
 */
export const WEB = process.env.VISUAL_WEB_URL ?? "http://localhost:8000";
export const MOCK = process.env.VISUAL_MOCK_URL ?? "http://localhost:9010";

export interface VisualRoute {
  key: string;
  url: string;
  cart?: boolean;
}

export const routes: VisualRoute[] = [
  { key: "web-home", url: `${WEB}/` },
  { key: "web-pilze", url: `${WEB}/unsere-pilze/` },
  { key: "web-growkits", url: `${WEB}/growkits/` },
  { key: "web-tinkturen", url: `${WEB}/tinkturen/` },
  { key: "web-gastronomie", url: `${WEB}/gastronomie/` },
  { key: "web-ueber-uns", url: `${WEB}/ueber-uns/` },
  { key: "web-faq", url: `${WEB}/faq/` },
  { key: "web-kontakt", url: `${WEB}/kontakt/` },
  { key: "web-impressum", url: `${WEB}/impressum/` },
  { key: "web-404", url: `${WEB}/gibt-es-nicht/` },
  { key: "shop-katalog", url: `${WEB}/shop/` },
  {
    key: "shop-produkt-growkit",
    url: `${WEB}/shop/rosenseitling-growkit/`,
  },
  { key: "shop-produkt-tinktur", url: `${WEB}/shop/lions-mane-tinktur/` },
  { key: "shop-pilzkorb", url: `${WEB}/shop/cart/`, cart: true },
  { key: "shop-kasse", url: `${WEB}/shop/checkout/`, cart: true },
  { key: "shop-agb", url: `${WEB}/agb/` },
  { key: "shop-widerrufen", url: `${WEB}/vertrag-widerrufen/` },
  { key: "shop-404", url: `${WEB}/shop/gibt-es-nicht/` },
];
