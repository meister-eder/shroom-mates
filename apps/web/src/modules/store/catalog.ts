import { listProducts } from "@lib/data/products";

type Products = Awaited<ReturnType<typeof listProducts>>;

/** Fresh mushrooms are not sold in the shop (link card to the website instead) */
const HIDDEN_CATEGORIES = ["frische-pilze"];
/** Growkits and tinctures in that order, everything else after */
const ORDER = ["growkits", "tinkturen"];

export interface Catalog {
  products: Products;
  /** [handle, { name, count }] in display order */
  categories: [string, { name: string; count: number }][];
  error?: Error;
}

export async function loadCatalog(regionId: string): Promise<Catalog> {
  let products: Products = [];
  let error: Error | undefined;

  try {
    products = await listProducts(regionId);
  } catch (e) {
    error = e instanceof Error ? e : new Error("Unknown error");
    console.error(error);
  }

  products = products.filter(
    (p) =>
      !p.categories?.some((c) => HIDDEN_CATEGORIES.includes(c.handle ?? "")),
  );

  const rank = (p: Products[number]) => {
    const i = ORDER.indexOf(p.categories?.[0]?.handle ?? "");
    return i === -1 ? ORDER.length : i;
  };
  products = [...products].sort((a, b) => rank(a) - rank(b));

  const map = new Map<string, { name: string; count: number }>();
  for (const product of products) {
    for (const cat of product.categories ?? []) {
      if (!cat.handle || !cat.name) continue;
      const entry = map.get(cat.handle) ?? { name: cat.name, count: 0 };
      entry.count += 1;
      map.set(cat.handle, entry);
    }
  }
  const pos = (h: string) => (ORDER.indexOf(h) === -1 ? 99 : ORDER.indexOf(h));
  const categories = Array.from(map.entries()).sort(
    ([a], [b]) => pos(a) - pos(b),
  );

  return { products, categories, error };
}
