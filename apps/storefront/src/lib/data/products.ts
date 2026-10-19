import { sdk } from "@lib/sdk";

const LIST_TTL_MS = 5 * 60 * 1000;
const listCache = new Map<
  string,
  { at: number; products: Awaited<ReturnType<typeof fetchProducts>> }
>();

export const listProducts = async (regionId: string) => {
  const hit = listCache.get(regionId);
  if (hit && Date.now() - hit.at < LIST_TTL_MS) return hit.products;
  const products = await fetchProducts(regionId);
  listCache.set(regionId, { at: Date.now(), products });
  return products;
};

const fetchProducts = async (regionId: string) => {
  try {
    const { products } = await sdk.store.product.list({
      region_id: regionId,
      // categories feed the filter chips on /store; inventory disables quick-add
      fields:
        "*variants.calculated_price,+variants.inventory_quantity,*categories,+metadata",
    });
    return products;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch products");
  }
};

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*categories,+metadata,+tags,";

/**
 * Product by URL slug. Accepts the handle, or a legacy product ID
 * ("prod_…") from old links. Returns null if it doesn't exist.
 */
export const retrieveProduct = async (handleOrId: string, regionId: string) => {
  try {
    if (handleOrId.startsWith("prod_")) {
      const { product } = await sdk.store.product.retrieve(handleOrId, {
        region_id: regionId,
        fields: PRODUCT_FIELDS,
      });
      return product;
    }
    const { products } = await sdk.store.product.list({
      handle: handleOrId,
      region_id: regionId,
      fields: PRODUCT_FIELDS,
      limit: 1,
    });
    return products[0] ?? null;
  } catch (error) {
    // Unknown product IDs are a normal 404, not an error.
    if ((error as { status?: number }).status === 404) return null;
    console.error(error);
    throw new Error("Failed to fetch product");
  }
};
