import { sdk } from "@lib/sdk";

export const listProducts = async (regionId: string) => {
  try {
    const { products } = await sdk.store.product.list({
      region_id: regionId,
      // categories feed the filter strip on /store
      fields: "*variants.calculated_price,*categories",
    });
    return products;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch products");
  }
};

export const retrieveProduct = async (
  productId: string,
  regionId: string,
) => {
  try {
    const { product } = await sdk.store.product.retrieve(productId, {
      region_id: regionId,
      fields:
        "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
    });
    return product;
  } catch (error) {
    // Unknown product IDs are a normal 404, not an error.
    if ((error as { status?: number }).status === 404) return null;
    console.error(error);
    throw new Error("Failed to fetch product");
  }
};
