/**
 * Seiten für den Screenshot-Vergleich. Der `key` ist der Name der Baseline und
 * bleibt gleich, auch wenn sich URLs ändern (z. B. beim Zusammenlegen von
 * Website und Shop): dann nur `url` anpassen, nie den `key`.
 *
 * `cart: true` legt vorher über den Medusa-Mock einen Pilzkorb mit einem
 * Artikel an (für Pilzkorb- und Kassen-Seite).
 */
export const WEBSITE = process.env.VISUAL_WEBSITE_URL ?? "http://localhost:4400";
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
	{ key: "shop-katalog", url: `${SHOP}/de/store` },
	{ key: "shop-produkt-growkit", url: `${SHOP}/de/store/rosenseitling-growkit` },
	{ key: "shop-produkt-tinktur", url: `${SHOP}/de/store/lions-mane-tinktur` },
	{ key: "shop-pilzkorb", url: `${SHOP}/de/cart`, cart: true },
	{ key: "shop-kasse", url: `${SHOP}/de/checkout`, cart: true },
	{ key: "shop-agb", url: `${SHOP}/de/agb` },
	{ key: "shop-widerrufen", url: `${SHOP}/de/vertrag-widerrufen` },
	{ key: "shop-404", url: `${SHOP}/de/store/gibt-es-nicht` },
];
