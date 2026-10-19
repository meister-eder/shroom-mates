import { sdk } from "@lib/sdk";
import type { HttpTypes } from "@medusajs/types";

const DEFAULT_REGION = import.meta.env.DEFAULT_REGION;
const TTL_MS = 3600 * 1000; // 1 hour

let cached: { region: HttpTypes.StoreRegion; at: number } | undefined;

export const listRegions = async () => {
  try {
    const { regions } = await sdk.store.region.list();
    return regions;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch regions");
  }
};

/**
 * The one region the shop sells in: the region containing the DEFAULT_REGION
 * country (if set), otherwise the first region. Cached for one hour.
 */
export const getRegion = async () => {
  if (cached && cached.at > Date.now() - TTL_MS) {
    return cached.region;
  }

  try {
    const regions = await listRegions();
    const region =
      (DEFAULT_REGION
        ? regions?.find((r) =>
            r.countries?.some(
              (c) => c.iso_2?.toLowerCase() === DEFAULT_REGION.toLowerCase(),
            ),
          )
        : undefined) ?? regions?.[0];

    if (!region) {
      return null;
    }

    cached = { region, at: Date.now() };
    return region;
  } catch {
    return null;
  }
};
